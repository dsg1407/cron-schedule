import type { ExecutionLog } from '../../domain/entities/execution-log.entity.js'
import { ExecutionLogNotFoundError } from '../../domain/errors.js'
import type { ExecutionLogRepository } from '../ports/execution-log.repository.js'

export interface GetExecutionDetailsUseCaseRequest {
  executionId: string
  userId: string
}

export interface GetExecutionDetailsUseCaseResponse {
  execution: ExecutionLog
}

export class GetExecutionDetailsUseCase {
  constructor(private readonly executionLogRepository: ExecutionLogRepository) {}

  async execute({
    executionId,
    userId,
  }: GetExecutionDetailsUseCaseRequest): Promise<GetExecutionDetailsUseCaseResponse> {
    const execution = await this.executionLogRepository.findByIdForUser(executionId, userId)

    if (!execution) {
      throw new ExecutionLogNotFoundError(executionId)
    }

    return { execution }
  }
}
