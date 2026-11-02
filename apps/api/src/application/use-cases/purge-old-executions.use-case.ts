import type { ExecutionLogRepository } from '../ports/execution-log.repository.js'

export interface PurgeOldExecutionsUseCaseRequest {
  userId: string
  olderThanDays: number
}

export interface PurgeOldExecutionsUseCaseResponse {
  deletedCount: number
}

export class PurgeOldExecutionsUseCase {
  constructor(private readonly executionLogRepository: ExecutionLogRepository) {}

  async execute({
    userId,
    olderThanDays,
  }: PurgeOldExecutionsUseCaseRequest): Promise<PurgeOldExecutionsUseCaseResponse> {
    const cutoffTimestamp = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    const beforeIso = new Date(cutoffTimestamp).toISOString()

    const deletedCount = await this.executionLogRepository.deleteOlderThanForUser(userId, beforeIso)

    return { deletedCount }
  }
}
