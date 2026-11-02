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
}

export async function buildApp(
  dependencies: AppDependencies,
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await registerCors(app)
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
