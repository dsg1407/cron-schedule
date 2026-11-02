export abstract class DomainError extends Error {
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly statusCode = 401

  constructor() {
    super('E-mail ou senha inválidos.')
  }
}

export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409

  constructor(readonly email: string) {
    super(`O e-mail ${email} já está cadastrado.`)
  }
}

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404

  constructor(readonly userId: string) {
    super(`Usuário ${userId} não encontrado.`)
  }
}

export class CronJobNotFoundError extends DomainError {
  readonly statusCode = 404

  constructor(readonly cronJobId: string) {
    super(`CronJob ${cronJobId} não encontrado.`)
  }
}

export class ExecutionLogNotFoundError extends DomainError {
  readonly statusCode = 404

  constructor(readonly executionId: string) {
    super(`Execução ${executionId} não encontrada.`)
  }
}

export class InvalidCronExpressionError extends DomainError {
  readonly statusCode = 400

  constructor(readonly cronExpression: string) {
    super(`A expressão cron "${cronExpression}" é inválida.`)
  }
}

export class ForbiddenTargetUrlError extends DomainError {
  readonly statusCode = 400

  constructor(reason: string) {
    super(`URL de serviço não permitida: ${reason}`)
  }
}
