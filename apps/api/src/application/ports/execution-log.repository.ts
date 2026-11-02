import type { ExecutionOutcome } from '../../domain/entities/cron-job.entity.js'
import type { ExecutionLog, TriggerType } from '../../domain/entities/execution-log.entity.js'

export interface ListExecutionsFilters {
  userId: string
  cronJobId?: string | null
  status?: ExecutionOutcome | null
  triggerType?: TriggerType | null
  search?: string | null
  pageIndex?: number
  perPage?: number
}

export interface ListExecutionsResult {
  executions: ExecutionLog[]
  totalCount: number
}

export interface ExecutionLogRepository {
  findByIdForUser(executionId: string, userId: string): Promise<ExecutionLog | null>
  listForUser(filters: ListExecutionsFilters): Promise<ListExecutionsResult>
  listSinceForUser(userId: string, sinceIso: string): Promise<ExecutionLog[]>
  create(executionLog: ExecutionLog): Promise<ExecutionLog>
  update(executionLog: ExecutionLog): Promise<ExecutionLog>
  deleteOlderThanForUser(userId: string, beforeIso: string): Promise<number>
}
