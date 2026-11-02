import type { CronJobRepository } from '../application/ports/cron-job.repository.js'
import type { ExecutionLogRepository } from '../application/ports/execution-log.repository.js'
import type { HttpExecutorPort } from '../application/ports/http-executor.port.js'
import type { PasswordHasherPort } from '../application/ports/password-hasher.port.js'
import type { SchedulerPort } from '../application/ports/scheduler.port.js'
import type { UserRepository } from '../application/ports/user.repository.js'
import { AuthenticateUserUseCase } from '../application/use-cases/authenticate-user.use-case.js'
import { CreateCronJobUseCase } from '../application/use-cases/create-cron-job.use-case.js'
import { DeleteCronJobUseCase } from '../application/use-cases/delete-cron-job.use-case.js'
import { ExecuteCronJobUseCase } from '../application/use-cases/execute-cron-job.use-case.js'
import { GetCronJobUseCase } from '../application/use-cases/get-cron-job.use-case.js'
import { GetDashboardMetricsUseCase } from '../application/use-cases/get-dashboard-metrics.use-case.js'
import { GetExecutionDetailsUseCase } from '../application/use-cases/get-execution-details.use-case.js'
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case.js'
import { ListCronJobsUseCase } from '../application/use-cases/list-cron-jobs.use-case.js'
import { ListExecutionsUseCase } from '../application/use-cases/list-executions.use-case.js'
import { PurgeOldExecutionsUseCase } from '../application/use-cases/purge-old-executions.use-case.js'
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case.js'
import { ToggleCronJobStatusUseCase } from '../application/use-cases/toggle-cron-job-status.use-case.js'
import { UpdateCronJobUseCase } from '../application/use-cases/update-cron-job.use-case.js'
import { UpdateUserSettingsUseCase } from '../application/use-cases/update-user-settings.use-case.js'
import type { DatabaseProvider, Env } from '../config/env.js'
import { ScryptPasswordHasherAdapter } from '../infra/cryptography/scrypt-password-hasher.adapter.js'
import { createPostgresConnection } from '../infra/database/postgres/client.js'
import { DrizzlePgCronJobRepository } from '../infra/database/postgres/drizzle-pg-cron-job.repository.js'
import { DrizzlePgExecutionLogRepository } from '../infra/database/postgres/drizzle-pg-execution-log.repository.js'
import { DrizzlePgUserRepository } from '../infra/database/postgres/drizzle-pg-user.repository.js'
import { createSqliteConnection } from '../infra/database/sqlite/client.js'
import { DrizzleCronJobRepository } from '../infra/database/sqlite/drizzle-cron-job.repository.js'
import { DrizzleExecutionLogRepository } from '../infra/database/sqlite/drizzle-execution-log.repository.js'
import { DrizzleUserRepository } from '../infra/database/sqlite/drizzle-user.repository.js'
import { FetchHttpExecutorAdapter } from '../infra/http/fetch-http-executor.adapter.js'
import { CronerSchedulerAdapter } from '../infra/scheduler/croner-scheduler.adapter.js'

export interface AppDependencies {
  databaseProvider: DatabaseProvider
  jwtSecret: string
  userRepository: UserRepository
  cronJobRepository: CronJobRepository
  executionLogRepository: ExecutionLogRepository
  scheduler: SchedulerPort
  httpExecutor: HttpExecutorPort
  passwordHasher: PasswordHasherPort
  registerUserUseCase: RegisterUserUseCase
  authenticateUserUseCase: AuthenticateUserUseCase
  getUserProfileUseCase: GetUserProfileUseCase
  updateUserSettingsUseCase: UpdateUserSettingsUseCase
  createCronJobUseCase: CreateCronJobUseCase
  updateCronJobUseCase: UpdateCronJobUseCase
  toggleCronJobStatusUseCase: ToggleCronJobStatusUseCase
  deleteCronJobUseCase: DeleteCronJobUseCase
  listCronJobsUseCase: ListCronJobsUseCase
  getCronJobUseCase: GetCronJobUseCase
  executeCronJobUseCase: ExecuteCronJobUseCase
  listExecutionsUseCase: ListExecutionsUseCase
  getExecutionDetailsUseCase: GetExecutionDetailsUseCase
  purgeOldExecutionsUseCase: PurgeOldExecutionsUseCase
  getDashboardMetricsUseCase: GetDashboardMetricsUseCase
  syncActiveCronJobs: () => Promise<void>
  shutdown: () => void
}

interface DatabaseRepositoriesBundle {
  userRepository: UserRepository
  cronJobRepository: CronJobRepository
  executionLogRepository: ExecutionLogRepository
  initializeSchema: () => Promise<void>
  close: () => void
}

function createDatabaseRepositories(env: Env): DatabaseRepositoriesBundle {
  if (env.DATABASE_PROVIDER === 'postgres') {
    const pgConnection = createPostgresConnection(env.DATABASE_URL)
    return {
      userRepository: new DrizzlePgUserRepository(pgConnection.db),
      cronJobRepository: new DrizzlePgCronJobRepository(pgConnection.db),
      executionLogRepository: new DrizzlePgExecutionLogRepository(pgConnection.db),
      initializeSchema: pgConnection.initializeSchema,
      close: pgConnection.close,
    }
  }

  const sqliteConnection = createSqliteConnection(env.DATABASE_URL)
  return {
    userRepository: new DrizzleUserRepository(sqliteConnection.db),
    cronJobRepository: new DrizzleCronJobRepository(sqliteConnection.db),
    executionLogRepository: new DrizzleExecutionLogRepository(sqliteConnection.db),
    initializeSchema: async () => {},
    close: sqliteConnection.close,
  }
}

export function makeApplication(env: Env): AppDependencies {
  const dbBundle = createDatabaseRepositories(env)

  const { userRepository, cronJobRepository, executionLogRepository } = dbBundle

  const scheduler = new CronerSchedulerAdapter()
  const httpExecutor = new FetchHttpExecutorAdapter(env.ALLOW_PRIVATE_NETWORKS)
  const passwordHasher = new ScryptPasswordHasherAdapter()

  const executeCronJobUseCase = new ExecuteCronJobUseCase(
    cronJobRepository,
    executionLogRepository,
    httpExecutor,
    scheduler,
  )

  const onScheduledTrigger = async (cronJobId: string) => {
    try {
      await executeCronJobUseCase.execute({
        cronJobId,
        triggerType: 'scheduled',
      })
    } catch {
      // Scheduled execution errors are already persisted in ExecutionLog
    }
  }

  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher)
  const authenticateUserUseCase = new AuthenticateUserUseCase(userRepository, passwordHasher)
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository)
  const updateUserSettingsUseCase = new UpdateUserSettingsUseCase(userRepository)

  const createCronJobUseCase = new CreateCronJobUseCase(
    cronJobRepository,
    scheduler,
    httpExecutor,
    onScheduledTrigger,
  )
  const updateCronJobUseCase = new UpdateCronJobUseCase(
    cronJobRepository,
    scheduler,
    httpExecutor,
    onScheduledTrigger,
  )
  const toggleCronJobStatusUseCase = new ToggleCronJobStatusUseCase(
    cronJobRepository,
    scheduler,
    onScheduledTrigger,
  )
  const deleteCronJobUseCase = new DeleteCronJobUseCase(cronJobRepository, scheduler)
  const listCronJobsUseCase = new ListCronJobsUseCase(cronJobRepository)
  const getCronJobUseCase = new GetCronJobUseCase(cronJobRepository)

  const listExecutionsUseCase = new ListExecutionsUseCase(executionLogRepository)
  const getExecutionDetailsUseCase = new GetExecutionDetailsUseCase(executionLogRepository)
  const purgeOldExecutionsUseCase = new PurgeOldExecutionsUseCase(executionLogRepository)
  const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
    cronJobRepository,
    executionLogRepository,
  )

  const syncActiveCronJobs = async () => {
    await dbBundle.initializeSchema()
    const activeCronJobs = await cronJobRepository.findAllActive()
    for (const activeJob of activeCronJobs) {
      scheduler.scheduleJob(activeJob, onScheduledTrigger)
    }
  }

  const shutdown = () => {
    scheduler.stopAll()
    dbBundle.close()
  }

  return {
    databaseProvider: env.DATABASE_PROVIDER,
    jwtSecret: env.JWT_SECRET,
    userRepository,
    cronJobRepository,
    executionLogRepository,
    scheduler,
    httpExecutor,
    passwordHasher,
    registerUserUseCase,
    authenticateUserUseCase,
    getUserProfileUseCase,
    updateUserSettingsUseCase,
    createCronJobUseCase,
    updateCronJobUseCase,
    toggleCronJobStatusUseCase,
    deleteCronJobUseCase,
    listCronJobsUseCase,
    getCronJobUseCase,
    executeCronJobUseCase,
    listExecutionsUseCase,
    getExecutionDetailsUseCase,
    purgeOldExecutionsUseCase,
    getDashboardMetricsUseCase,
    syncActiveCronJobs,
    shutdown,
  }
}
