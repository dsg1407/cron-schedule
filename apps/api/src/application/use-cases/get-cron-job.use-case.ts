import type { CronJob } from '../../domain/entities/cron-job.entity.js'
import { CronJobNotFoundError } from '../../domain/errors.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'

export interface GetCronJobUseCaseRequest {
  cronJobId: string
  userId: string
}

export interface GetCronJobUseCaseResponse {
  cronJob: CronJob
}

export class GetCronJobUseCase {
  constructor(private readonly cronJobRepository: CronJobRepository) {}

  async execute({
    cronJobId,
    userId,
  }: GetCronJobUseCaseRequest): Promise<GetCronJobUseCaseResponse> {
    const cronJob = await this.cronJobRepository.findByIdForUser(cronJobId, userId)

    if (!cronJob) {
      throw new CronJobNotFoundError(cronJobId)
    }

    return { cronJob }
  }
}
