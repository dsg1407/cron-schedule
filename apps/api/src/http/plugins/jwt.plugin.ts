import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance } from 'fastify'

export async function registerJwt(app: FastifyInstance, jwtSecret: string): Promise<void> {
  await app.register(fastifyJwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '7d',
    },
  })
}
