import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { AuthenticateUserUseCase } from '../../application/use-cases/authenticate-user.use-case.js'
import type { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js'
import { presentUser } from '../presenters/user.presenter.js'
import {
  authSuccessResponseSchema,
  authenticateUserBodySchema,
  registerUserBodySchema,
} from '../schemas/auth.schema.js'
import { errorResponseSchema } from '../schemas/common.schema.js'

export interface AuthRoutesDependencies {
  registerUserUseCase: RegisterUserUseCase
  authenticateUserUseCase: AuthenticateUserUseCase
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: AuthRoutesDependencies,
): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/api/auth/register',
    {
      schema: {
        tags: ['auth'],
        body: registerUserBodySchema,
        response: {
          201: authSuccessResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { user } = await dependencies.registerUserUseCase.execute(request.body)
      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
      })

      return reply.status(201).send({
        token,
        user: presentUser(user),
      })
    },
  )

  typedApp.post(
    '/api/auth/login',
    {
      schema: {
        tags: ['auth'],
        body: authenticateUserBodySchema,
        response: {
          200: authSuccessResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { user } = await dependencies.authenticateUserUseCase.execute(request.body)
      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
      })

      return reply.status(200).send({
        token,
        user: presentUser(user),
      })
    },
  )
}
