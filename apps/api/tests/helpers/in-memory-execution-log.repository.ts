import type {
  ExecutionLogRepository,
  ListExecutionsFilters,
  ListExecutionsResult,
} from '../../src/application/ports/execution-log.repository.js'
import type { ExecutionLog } from '../../src/domain/entities/execution-log.entity.js'

export class InMemoryExecutionLogRepository implements ExecutionLogRepository {
  public items: ExecutionLog[] = []

  async findByIdForUser(executionId: string, userId: string): Promise<ExecutionLog | null> {
    return (
      this.items.find(
        (executionLog) => executionLog.id === executionId && executionLog.userId === userId,
      ) ?? null
    )
  }

  async listForUser({
    userId,
    cronJobId,
    status,
    triggerType,
    search,
    pageIndex = 0,
    perPage = 20,
  }: ListExecutionsFilters): Promise<ListExecutionsResult> {
    const filtered = this.items.filter((executionLog) => {
      if (executionLog.userId !== userId) return false
      if (cronJobId && executionLog.cronJobId !== cronJobId) return false
      if (status && executionLog.status !== status) return false
      if (triggerType && executionLog.triggerType !== triggerType) return false
      if (search && search.trim().length > 0) {
        const query = search.trim().toLowerCase()
        const matchesUrl = executionLog.requestUrl.toLowerCase().includes(query)
        const matchesJobName = executionLog.cronJobName?.toLowerCase().includes(query) ?? false
        const matchesError = executionLog.errorMessage?.toLowerCase().includes(query) ?? false
        return matchesUrl || matchesJobName || matchesError
      }
      return true
    })

    const sorted = [...filtered].sort((first, second) =>
      second.startedAt.localeCompare(first.startedAt),
    )

    const startOffset = pageIndex * perPage
    return {
      executions: sorted.slice(startOffset, startOffset + perPage),
      totalCount: filtered.length,
    }
  }

  async listSinceForUser(userId: string, sinceIso: string): Promise<ExecutionLog[]> {
    return this.items
      .filter(
        (executionLog) => executionLog.userId === userId && executionLog.startedAt >= sinceIso,
      )
      .sort((first, second) => second.startedAt.localeCompare(first.startedAt))
  }

  async create(executionLog: ExecutionLog): Promise<ExecutionLog> {
    this.items.push(executionLog)
    return executionLog
  }

  async update(executionLog: ExecutionLog): Promise<ExecutionLog> {
    const itemIndex = this.items.findIndex((existing) => existing.id === executionLog.id)
    if (itemIndex >= 0) {
      this.items[itemIndex] = executionLog
    }
    return executionLog
  }

  async deleteOlderThanForUser(userId: string, beforeIso: string): Promise<number> {
    const beforeCount = this.items.length
    this.items = this.items.filter(
      (executionLog) => !(executionLog.userId === userId && executionLog.startedAt < beforeIso),
    )
    return beforeCount - this.items.length
  }
}
