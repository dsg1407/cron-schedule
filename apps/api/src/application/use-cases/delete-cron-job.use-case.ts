import { CronJobNotFoundError } from '../../domain/errors.js'
import type { CronJobRepository } from '../ports/cron-job.repository.js'
import type { SchedulerPort } from '../ports/scheduler.port.js'

export interface DeleteCronJobUseCaseRequest {
  cronJobId: string
  userId: string
}

export interface DeleteCronJobUseCaseResponse {
  deleted: boolean
}

export class DeleteCronJobUseCase {
  constructor(
    private readonly cronJobRepository: CronJobRepository,
    private readonly scheduler: SchedulerPort,
  ) {}

  async execute({
    cronJobId,
    userId,
  }: DeleteCronJobUseCaseRequest): Promise<DeleteCronJobUseCaseResponse> {
    const deleted = await this.cronJobRepository.deleteForUser(cronJobId, userId)

    if (!deleted) {
      throw new CronJobNotFoundError(cronJobId)
    }

    this.scheduler.unscheduleJob(cronJobId)

    return { deleted: true }
  }
}
