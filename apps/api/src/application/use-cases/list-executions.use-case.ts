import type { ExecutionOutcome } from '../../domain/entities/cron-job.entity.js'
import type { ExecutionLog, TriggerType } from '../../domain/entities/execution-log.entity.js'
import type { ExecutionLogRepository } from '../ports/execution-log.repository.js'

export interface ListExecutionsUseCaseRequest {
  userId: string
  cronJobId?: string | null
  status?: ExecutionOutcome | null
  triggerType?: TriggerType | null
  search?: string | null
  pageIndex?: number
  perPage?: number
}

export interface ListExecutionsUseCaseResponse {
  executions: ExecutionLog[]
  meta: {
    pageIndex: number
    perPage: number
    totalCount: number
  }
}

export class ListExecutionsUseCase {
  constructor(private readonly executionLogRepository: ExecutionLogRepository) {}

  async execute({
    userId,
    cronJobId,
    status,
    triggerType,
    search,
    pageIndex = 0,
    perPage = 20,
  }: ListExecutionsUseCaseRequest): Promise<ListExecutionsUseCaseResponse> {
    const { executions, totalCount } = await this.executionLogRepository.listForUser({
      userId,
      cronJobId,
      status,
      triggerType,
      search,
      pageIndex,
      perPage,
    })

    return {
      executions,
      meta: {
        pageIndex,
        perPage,
        totalCount,
      },
    }
  }
}
