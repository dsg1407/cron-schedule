import type { CronJob, CronJobStatus } from '../../domain/entities/cron-job.entity.js'

export interface ListCronJobsFilters {
  userId: string
  search?: string | null
  status?: CronJobStatus | null
  pageIndex?: number
  perPage?: number
}

export interface ListCronJobsResult {
  cronJobs: CronJob[]
  totalCount: number
}

export interface CronJobRepository {
  findByIdForUser(cronJobId: string, userId: string): Promise<CronJob | null>
  findById(cronJobId: string): Promise<CronJob | null>
  findAllActive(): Promise<CronJob[]>
  listForUser(filters: ListCronJobsFilters): Promise<ListCronJobsResult>
  countForUser(userId: string): Promise<number>
  create(cronJob: CronJob): Promise<CronJob>
  update(cronJob: CronJob): Promise<CronJob>
  deleteForUser(cronJobId: string, userId: string): Promise<boolean>
}
