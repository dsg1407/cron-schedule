import { beforeEach, describe, expect, it } from 'vitest'
import { CreateCronJobUseCase } from '../../../../src/application/use-cases/create-cron-job.use-case.js'
import { DeleteCronJobUseCase } from '../../../../src/application/use-cases/delete-cron-job.use-case.js'
import { GetCronJobUseCase } from '../../../../src/application/use-cases/get-cron-job.use-case.js'
import { ListCronJobsUseCase } from '../../../../src/application/use-cases/list-cron-jobs.use-case.js'
import { ToggleCronJobStatusUseCase } from '../../../../src/application/use-cases/toggle-cron-job-status.use-case.js'
import { UpdateCronJobUseCase } from '../../../../src/application/use-cases/update-cron-job.use-case.js'
import {
  CronJobNotFoundError,
  ForbiddenTargetUrlError,
  InvalidCronExpressionError,
} from '../../../../src/domain/errors.js'
import { FakeHttpExecutor } from '../../../helpers/fake-http-executor.js'
import { FakeScheduler } from '../../../helpers/fake-scheduler.js'
import { InMemoryCronJobRepository } from '../../../helpers/in-memory-cron-job.repository.js'

describe('CronJob Management Use Cases', () => {
  let cronJobRepository: InMemoryCronJobRepository
  let scheduler: FakeScheduler
  let httpExecutor: FakeHttpExecutor
  let createCronJobUseCase: CreateCronJobUseCase
  let updateCronJobUseCase: UpdateCronJobUseCase
  let toggleCronJobStatusUseCase: ToggleCronJobStatusUseCase
  let deleteCronJobUseCase: DeleteCronJobUseCase
  let listCronJobsUseCase: ListCronJobsUseCase
  let getCronJobUseCase: GetCronJobUseCase

  beforeEach(() => {
    cronJobRepository = new InMemoryCronJobRepository()
    scheduler = new FakeScheduler()
    httpExecutor = new FakeHttpExecutor()
    const noopCallback = async () => {}

    createCronJobUseCase = new CreateCronJobUseCase(
      cronJobRepository,
      scheduler,
      httpExecutor,
      noopCallback,
    )
    updateCronJobUseCase = new UpdateCronJobUseCase(
      cronJobRepository,
      scheduler,
      httpExecutor,
      noopCallback,
    )
    toggleCronJobStatusUseCase = new ToggleCronJobStatusUseCase(
      cronJobRepository,
      scheduler,
      noopCallback,
    )
    deleteCronJobUseCase = new DeleteCronJobUseCase(cronJobRepository, scheduler)
    listCronJobsUseCase = new ListCronJobsUseCase(cronJobRepository)
    getCronJobUseCase = new GetCronJobUseCase(cronJobRepository)
  })

  it('creates an active cron job and schedules it immediately', async () => {
    const { cronJob } = await createCronJobUseCase.execute({
      userId: 'user-1',
      name: 'Backup Database',
      description: 'Daily database backup',
      icon: 'database',
      url: 'https://api.example.com/backup',
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
      body: '{"mode":"incremental"}',
      cronExpression: '0 2 * * *',
      timezone: 'America/Sao_Paulo',
    })

    expect(cronJob.id).toBeTruthy()
    expect(cronJob.status).toBe('active')
    expect(cronJob.nextRunAt).toBeTruthy()
    expect(scheduler.scheduledJobs.has(cronJob.id)).toBe(true)
  })

  it('throws InvalidCronExpressionError when cron expression is malformed', async () => {
    await expect(
      createCronJobUseCase.execute({
        userId: 'user-1',
        name: 'Bad Job',
        url: 'https://api.example.com/ping',
        method: 'GET',
        cronExpression: 'invalid cron',
      }),
    ).rejects.toBeInstanceOf(InvalidCronExpressionError)
  })

  it('throws ForbiddenTargetUrlError when protocol is not http or https', async () => {
    await expect(
      createCronJobUseCase.execute({
        userId: 'user-1',
        name: 'FTP Job',
        url: 'ftp://files.example.com/archive',
        method: 'GET',
        cronExpression: '0 * * * *',
      }),
    ).rejects.toBeInstanceOf(ForbiddenTargetUrlError)
  })

  it('toggles status between active and paused and updates scheduler', async () => {
    const { cronJob } = await createCronJobUseCase.execute({
      userId: 'user-1',
      name: 'Clean Temp Files',
      url: 'https://api.example.com/clean',
      method: 'DELETE',
      cronExpression: '0 */6 * * *',
    })

    const { cronJob: pausedJob } = await toggleCronJobStatusUseCase.execute({
      cronJobId: cronJob.id,
      userId: 'user-1',
    })

    expect(pausedJob.status).toBe('paused')
    expect(pausedJob.nextRunAt).toBeNull()
    expect(scheduler.scheduledJobs.has(cronJob.id)).toBe(false)

    const { cronJob: resumedJob } = await toggleCronJobStatusUseCase.execute({
      cronJobId: cronJob.id,
      userId: 'user-1',
    })

    expect(resumedJob.status).toBe('active')
    expect(resumedJob.nextRunAt).toBeTruthy()
    expect(scheduler.scheduledJobs.has(cronJob.id)).toBe(true)
  })

  it('prevents another user from accessing, updating or deleting a cron job', async () => {
    const { cronJob } = await createCronJobUseCase.execute({
      userId: 'user-1',
      name: 'Send Reports',
      url: 'https://api.example.com/reports',
      method: 'POST',
      cronExpression: '0 9 * * 1',
    })

    await expect(
      getCronJobUseCase.execute({ cronJobId: cronJob.id, userId: 'user-2' }),
    ).rejects.toBeInstanceOf(CronJobNotFoundError)

    await expect(
      updateCronJobUseCase.execute({
        cronJobId: cronJob.id,
        userId: 'user-2',
        name: 'Hijacked',
      }),
    ).rejects.toBeInstanceOf(CronJobNotFoundError)

    await expect(
      deleteCronJobUseCase.execute({ cronJobId: cronJob.id, userId: 'user-2' }),
    ).rejects.toBeInstanceOf(CronJobNotFoundError)
  })

  it('filters cron jobs by search term and status', async () => {
    await createCronJobUseCase.execute({
      userId: 'user-1',
      name: 'Backup Database',
      url: 'https://api.example.com/backup',
      method: 'POST',
      cronExpression: '0 2 * * *',
      status: 'active',
    })
    await createCronJobUseCase.execute({
      userId: 'user-1',
      name: 'Update Analytics',
      url: 'https://api.example.com/analytics',
      method: 'POST',
      cronExpression: '0 */2 * * *',
      status: 'paused',
    })

    const { cronJobs: pausedList } = await listCronJobsUseCase.execute({
      userId: 'user-1',
      status: 'paused',
    })
    expect(pausedList).toHaveLength(1)
    expect(pausedList[0]?.name).toBe('Update Analytics')

    const { cronJobs: searchedList } = await listCronJobsUseCase.execute({
      userId: 'user-1',
      search: 'backup',
    })
    expect(searchedList).toHaveLength(1)
    expect(searchedList[0]?.name).toBe('Backup Database')
  })
})
