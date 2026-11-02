import type { CronJob, CronJobStatus } from '../../domain/entities/cron-job.entity.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'

export interface ListCronJobsUseCaseRequest {
  userId: string
  search?: string | null
  status?: CronJobStatus | null
  pageIndex?: number
  perPage?: number
}

export interface ListCronJobsUseCaseResponse {
  cronJobs: CronJob[]
  meta: {
    pageIndex: number
    perPage: number
    totalCount: number
  }
}

export class ListCronJobsUseCase {
  constructor(private readonly cronJobRepository: CronJobRepository) {}

  async execute({
    userId,
    search,
    status,
    pageIndex = 0,
    perPage = 20,
  }: ListCronJobsUseCaseRequest): Promise<ListCronJobsUseCaseResponse> {
    const { cronJobs, totalCount } = await this.cronJobRepository.listForUser({
      userId,
      search,
      status,
      pageIndex,
      perPage,
    })

    return {
      cronJobs,
      meta: {
        pageIndex,
        perPage,
        totalCount,
      },
    }
  }
}
