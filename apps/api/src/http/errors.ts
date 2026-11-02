import { DomainError } from '../domain/errors.js'

export class UnauthorizedError extends DomainError {
  readonly statusCode = 401

  constructor(message = 'Não autorizado. Faça login novamente.') {
    super(message)
  }
}
