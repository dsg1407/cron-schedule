import type { FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../errors.js'

export async function verifyJwt(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError()
  }
}
