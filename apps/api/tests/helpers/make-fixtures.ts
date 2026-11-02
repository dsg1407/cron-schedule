import type { CronJob } from '../../src/domain/entities/cron-job.entity.js'
import type { ExecutionLog } from '../../src/domain/entities/execution-log.entity.js'
import type { User } from '../../src/domain/entities/user.entity.js'
import { newId } from '../../src/domain/new-id.js'

export function makeUserFixture(overrides: Partial<User> = {}): User {
  const nowIso = new Date().toISOString()
  return {
    id: newId(),
    name: 'Diego Goncalves',
    email: 'diego@cronflow.dev',
    passwordHash: 'hashed:secret123',
    defaultTimezone: 'America/Sao_Paulo',
    defaultTimeoutMs: 30000,
    defaultMaxRetries: 1,
    retentionDays: 30,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  }
}

export function makeCronJobFixture(overrides: Partial<CronJob> = {}): CronJob {
  const nowIso = new Date().toISOString()
  return {
    id: newId(),
    userId: overrides.userId ?? newId(),
    name: 'Backup Database',
    description: 'Daily database backup',
    icon: 'database',
    url: 'https://api.example.com/webhooks/backup',
    method: 'POST',
    headers: { 'x-api-key': 'secret-token' },
    body: '{"full":true}',
    cronExpression: '0 2 * * *',
    timezone: 'America/Sao_Paulo',
    timeoutMs: 30000,
    maxRetries: 1,
    status: 'active',
    lastRunAt: null,
    nextRunAt: new Date(Date.now() + 3600000).toISOString(),
    lastStatus: null,
    lastDurationMs: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  }
}

export function makeExecutionLogFixture(overrides: Partial<ExecutionLog> = {}): ExecutionLog {
  const nowIso = new Date().toISOString()
  return {
    id: newId(),
    cronJobId: overrides.cronJobId ?? newId(),
    cronJobName: 'Backup Database',
    cronJobIcon: 'database',
    userId: overrides.userId ?? newId(),
    triggerType: 'scheduled',
    status: 'success',
    requestUrl: 'https://api.example.com/webhooks/backup',
    requestMethod: 'POST',
    requestHeaders: { 'x-api-key': 'secret-token' },
    requestBody: '{"full":true}',
    httpStatusCode: 200,
    durationMs: 230,
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: '{"backupId":"bkp-01"}',
    errorMessage: null,
    attemptCount: 1,
    startedAt: nowIso,
    finishedAt: nowIso,
    ...overrides,
  }
}
