import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/api/health',
    {
      schema: {
        tags: ['health'],
        response: {
          200: z.object({
            status: z.literal('ok'),
            timestamp: z.string(),
          }),
        },
      },
    },
    async () => {
      return {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      }
    },
  )
}
