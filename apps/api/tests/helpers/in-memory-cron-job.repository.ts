import type {
  CronJobRepository,
  ListCronJobsFilters,
  ListCronJobsResult,
} from '../../src/application/ports/cron-job.repository.js'
import type { CronJob } from '../../src/domain/entities/cron-job.entity.js'

export class InMemoryCronJobRepository implements CronJobRepository {
  public items: CronJob[] = []

  async findByIdForUser(cronJobId: string, userId: string): Promise<CronJob | null> {
    return (
      this.items.find((cronJob) => cronJob.id === cronJobId && cronJob.userId === userId) ?? null
    )
  }

  async findById(cronJobId: string): Promise<CronJob | null> {
    return this.items.find((cronJob) => cronJob.id === cronJobId) ?? null
  }

  async findAllActive(): Promise<CronJob[]> {
    return this.items.filter((cronJob) => cronJob.status === 'active')
  }

  async listForUser({
    userId,
    search,
    status,
    pageIndex = 0,
    perPage = 20,
  }: ListCronJobsFilters): Promise<ListCronJobsResult> {
    const filtered = this.items.filter((cronJob) => {
      if (cronJob.userId !== userId) return false
      if (status && cronJob.status !== status) return false
      if (search && search.trim().length > 0) {
        const query = search.trim().toLowerCase()
        const matchesName = cronJob.name.toLowerCase().includes(query)
        const matchesDescription = cronJob.description?.toLowerCase().includes(query) ?? false
        const matchesUrl = cronJob.url.toLowerCase().includes(query)
        return matchesName || matchesDescription || matchesUrl
      }
      return true
    })

    const sorted = [...filtered].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )

    const startOffset = pageIndex * perPage
    return {
      cronJobs: sorted.slice(startOffset, startOffset + perPage),
      totalCount: filtered.length,
    }
  }

  async countForUser(userId: string): Promise<number> {
    return this.items.filter((cronJob) => cronJob.userId === userId).length
  }

  async create(cronJob: CronJob): Promise<CronJob> {
    this.items.push(cronJob)
    return cronJob
  }

  async update(cronJob: CronJob): Promise<CronJob> {
    const itemIndex = this.items.findIndex((existing) => existing.id === cronJob.id)
    if (itemIndex >= 0) {
      this.items[itemIndex] = cronJob
    }
    return cronJob
  }

  async deleteForUser(cronJobId: string, userId: string): Promise<boolean> {
    const itemIndex = this.items.findIndex(
      (cronJob) => cronJob.id === cronJobId && cronJob.userId === userId,
    )
    if (itemIndex < 0) {
      return false
    }
    this.items.splice(itemIndex, 1)
    return true
  }
}
