import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case.js'
import type { UpdateUserSettingsUseCase } from '../../application/use-cases/update-user-settings.use-case.js'
import { presentUser } from '../presenters/user.presenter.js'
import { errorResponseSchema } from '../schemas/common.schema.js'
import { updateUserSettingsBodySchema, userResponseSchema } from '../schemas/profile.schema.js'

export interface ProfileRoutesDependencies {
  getUserProfileUseCase: GetUserProfileUseCase
  updateUserSettingsUseCase: UpdateUserSettingsUseCase
}

export async function registerProfileRoutes(
  app: FastifyInstance,
  dependencies: ProfileRoutesDependencies,
): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/api/me',
    {
      schema: {
        tags: ['profile'],
        response: {
          200: z.object({ user: userResponseSchema }),
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { user } = await dependencies.getUserProfileUseCase.execute({
        userId: request.user.sub,
      })
      return { user: presentUser(user) }
    },
  )

  typedApp.patch(
    '/api/me/settings',
    {
      schema: {
        tags: ['profile'],
        body: updateUserSettingsBodySchema,
        response: {
          200: z.object({ user: userResponseSchema }),
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { user } = await dependencies.updateUserSettingsUseCase.execute({
        userId: request.user.sub,
        ...request.body,
      })
      return { user: presentUser(user) }
    },
  )
}
