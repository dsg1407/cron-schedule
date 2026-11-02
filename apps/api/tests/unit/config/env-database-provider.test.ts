import { describe, expect, it } from 'vitest'
import { loadEnv } from '../../../src/config/env.js'
import { makeApplication } from '../../../src/factories/make-application.js'
import { DrizzlePgCronJobRepository } from '../../../src/infra/database/postgres/drizzle-pg-cron-job.repository.js'
import { DrizzlePgExecutionLogRepository } from '../../../src/infra/database/postgres/drizzle-pg-execution-log.repository.js'
import { DrizzlePgUserRepository } from '../../../src/infra/database/postgres/drizzle-pg-user.repository.js'
import { DrizzleCronJobRepository } from '../../../src/infra/database/sqlite/drizzle-cron-job.repository.js'
import { DrizzleExecutionLogRepository } from '../../../src/infra/database/sqlite/drizzle-execution-log.repository.js'
import { DrizzleUserRepository } from '../../../src/infra/database/sqlite/drizzle-user.repository.js'

describe('Environment & Database Provider Routing (SQLite in dev/test, PostgreSQL in production)', () => {
  it('uses SQLite by default in development and test environments', () => {
    const devEnv = loadEnv({ NODE_ENV: 'development' })
    expect(devEnv.DATABASE_PROVIDER).toBe('sqlite')
    expect(devEnv.DATABASE_URL).toBe('./data/cronflow.db')
    expect(devEnv.ALLOW_PRIVATE_NETWORKS).toBe(true)

    const testEnv = loadEnv({ NODE_ENV: 'test', DATABASE_URL: ':memory:' })
    expect(testEnv.DATABASE_PROVIDER).toBe('sqlite')
    expect(testEnv.DATABASE_URL).toBe(':memory:')
  })

  it('uses PostgreSQL in production and rejects SQLite paths in production', () => {
    const prodEnv = loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/cronflow_prod',
      JWT_SECRET: 'super-secret-production-key',
    })

    expect(prodEnv.DATABASE_PROVIDER).toBe('postgres')
    expect(prodEnv.DATABASE_URL).toBe('postgresql://user:pass@db.example.com:5432/cronflow_prod')
    expect(prodEnv.ALLOW_PRIVATE_NETWORKS).toBe(false)

    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: './data/cronflow.db',
      }),
    ).toThrow(/PostgreSQL/i)
  })

  it('wires SQLite repositories in test/dev and PostgreSQL repositories in production', () => {
    const sqliteApp = makeApplication(
      loadEnv({
        NODE_ENV: 'test',
        DATABASE_URL: ':memory:',
      }),
    )

    expect(sqliteApp.databaseProvider).toBe('sqlite')
    expect(sqliteApp.userRepository).toBeInstanceOf(DrizzleUserRepository)
    expect(sqliteApp.cronJobRepository).toBeInstanceOf(DrizzleCronJobRepository)
    expect(sqliteApp.executionLogRepository).toBeInstanceOf(DrizzleExecutionLogRepository)
    sqliteApp.shutdown()

    const postgresApp = makeApplication(
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cronflow',
      }),
    )

    expect(postgresApp.databaseProvider).toBe('postgres')
    expect(postgresApp.userRepository).toBeInstanceOf(DrizzlePgUserRepository)
    expect(postgresApp.cronJobRepository).toBeInstanceOf(DrizzlePgCronJobRepository)
    expect(postgresApp.executionLogRepository).toBeInstanceOf(DrizzlePgExecutionLogRepository)
    postgresApp.shutdown()
  })
})
