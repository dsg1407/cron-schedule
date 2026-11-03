import fastifyRateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { AppDependencies } from './factories/make-application.js'
import { registerErrorHandlers } from './http/error-handler.js'
import { verifyJwt } from './http/hooks/verify-jwt.hook.js'
import { registerCors } from './http/plugins/cors.plugin.js'
import { registerJwt } from './http/plugins/jwt.plugin.js'
import { registerSwagger } from './http/plugins/swagger.plugin.js'
import { registerAuthRoutes } from './http/routes/auth.routes.js'
import { registerCronJobsRoutes } from './http/routes/cron-jobs.routes.js'
import { registerDashboardRoutes } from './http/routes/dashboard.routes.js'
import { registerExecutionsRoutes } from './http/routes/executions.routes.js'
import { registerHealthRoutes } from './http/routes/health.routes.js'
import { registerProfileRoutes } from './http/routes/profile.routes.js'

export interface BuildAppOptions {
  logger?: boolean
  disableRateLimit?: boolean
  trustProxy?: boolean | string | string[]
}

export async function buildApp(
  dependencies: AppDependencies,
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? true,
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  if (!options.disableRateLimit) {
    await app.register(fastifyRateLimit, {
      global: true,
      max: 120,
      timeWindow: '1 minute',
      errorResponseBuilder: (request, context) => ({
        status: 429,
        error: 'Too Many Requests',
        message: `Muitas requisições. Tente novamente em ${context.after}.`,
        timestamp: new Date().toISOString(),
        path: request.url,
      }),
    })
  }

  await registerCors(app, dependencies.corsOrigin)
  await registerJwt(app, dependencies.jwtSecret)
  await registerSwagger(app)
  registerErrorHandlers(app)

  await registerHealthRoutes(app)
  await registerAuthRoutes(app, dependencies)

  await app.register(async (protectedScope) => {
    protectedScope.addHook('onRequest', verifyJwt)
    await registerProfileRoutes(protectedScope, dependencies)
    await registerDashboardRoutes(protectedScope, dependencies)
    await registerCronJobsRoutes(protectedScope, dependencies)
    await registerExecutionsRoutes(protectedScope, dependencies)
  })

  await app.ready()
  return app
}
