import { STATUS_CODES } from 'node:http'
import type { FastifyInstance } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { DomainError } from '../domain/errors.js'

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const statusCode = 404
    return reply.status(statusCode).send({
      status: statusCode,
      error: STATUS_CODES[statusCode] ?? 'Not Found',
      message: `Rota ${request.method} ${request.url} não encontrada.`,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  })

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const statusCode = 400
      const issuesMessage = error.validation
        .map((issue) => `${issue.instancePath || 'campo'}: ${issue.message}`)
        .join('; ')

      return reply.status(statusCode).send({
        status: statusCode,
        error: STATUS_CODES[statusCode] ?? 'Bad Request',
        message: `Dados inválidos: ${issuesMessage}`,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
    }

    if (error instanceof DomainError) {
      const statusCode = error.statusCode
      return reply.status(statusCode).send({
        status: statusCode,
        error: STATUS_CODES[statusCode] ?? 'Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      const statusCode = error.statusCode
      const message =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : (STATUS_CODES[statusCode] ?? 'Bad Request')

      return reply.status(statusCode).send({
        status: statusCode,
        error: STATUS_CODES[statusCode] ?? 'Bad Request',
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
    }

    request.log.error({ err: error }, 'Unhandled application error')

    const statusCode = 500
    return reply.status(statusCode).send({
      status: statusCode,
      error: STATUS_CODES[statusCode] ?? 'Internal Server Error',
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  })
}
