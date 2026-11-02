import { foreignKey, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    defaultTimezone: text('default_timezone').notNull().default('America/Sao_Paulo'),
    defaultTimeoutMs: integer('default_timeout_ms').notNull().default(30000),
    defaultMaxRetries: integer('default_max_retries').notNull().default(1),
    retentionDays: integer('retention_days').notNull().default(30),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('users_email_unique_idx').on(table.email)],
)

export const cronJobs = sqliteTable(
  'cron_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull().default('globe'),
    url: text('url').notNull(),
    method: text('method').notNull().default('GET'),
    headersJson: text('headers_json').notNull().default('{}'),
    body: text('body'),
    cronExpression: text('cron_expression').notNull(),
    timezone: text('timezone').notNull().default('America/Sao_Paulo'),
    timeoutMs: integer('timeout_ms').notNull().default(30000),
    maxRetries: integer('max_retries').notNull().default(1),
    status: text('status').notNull().default('active'),
    lastRunAt: text('last_run_at'),
    nextRunAt: text('next_run_at'),
    lastStatus: text('last_status'),
    lastDurationMs: integer('last_duration_ms'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'cron_jobs_user_fk',
    }).onDelete('cascade'),
    index('cron_jobs_user_id_idx').on(table.userId),
    index('cron_jobs_status_idx').on(table.status),
  ],
)

export const executionLogs = sqliteTable(
  'execution_logs',
  {
    id: text('id').primaryKey(),
    cronJobId: text('cron_job_id').notNull(),
    userId: text('user_id').notNull(),
    triggerType: text('trigger_type').notNull(),
    status: text('status').notNull(),
    requestUrl: text('request_url').notNull(),
    requestMethod: text('request_method').notNull(),
    requestHeadersJson: text('request_headers_json').notNull().default('{}'),
    requestBody: text('request_body'),
    httpStatusCode: integer('http_status_code'),
    durationMs: integer('duration_ms'),
    responseHeadersJson: text('response_headers_json').notNull().default('{}'),
    responseBody: text('response_body'),
    errorMessage: text('error_message'),
    attemptCount: integer('attempt_count').notNull().default(1),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
  },
  (table) => [
    foreignKey({
      columns: [table.cronJobId],
      foreignColumns: [cronJobs.id],
      name: 'execution_logs_cron_job_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'execution_logs_user_fk',
    }).onDelete('cascade'),
    index('execution_logs_cron_job_id_idx').on(table.cronJobId),
    index('execution_logs_user_id_started_at_idx').on(table.userId, table.startedAt),
  ],
)
