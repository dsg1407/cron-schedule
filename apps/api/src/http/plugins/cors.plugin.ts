import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

export async function registerCors(
  app: FastifyInstance,
  origin: boolean | string | string[] = true,
): Promise<void> {
  await app.register(fastifyCors, {
    origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
}
