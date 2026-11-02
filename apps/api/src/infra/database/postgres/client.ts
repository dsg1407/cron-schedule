import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

export type PostgresDatabase = NodePgDatabase<typeof schema>

export interface PostgresDatabaseConnection {
  db: PostgresDatabase
  pgPool: Pool
  initializeSchema: () => Promise<void>
  close: () => void
}

const BOOTSTRAP_POSTGRES_DDL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  default_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  default_timeout_ms INTEGER NOT NULL DEFAULT 30000,
  default_max_retries INTEGER NOT NULL DEFAULT 1,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email);

CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'globe',
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  headers_json TEXT NOT NULL DEFAULT '{}',
  body TEXT,
  cron_expression TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  timeout_ms INTEGER NOT NULL DEFAULT 30000,
  max_retries INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  last_run_at TEXT,
  next_run_at TEXT,
  last_status TEXT,
  last_duration_ms INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT cron_jobs_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cron_jobs_user_id_idx ON cron_jobs (user_id);
CREATE INDEX IF NOT EXISTS cron_jobs_status_idx ON cron_jobs (status);

CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY NOT NULL,
  cron_job_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL,
  request_url TEXT NOT NULL,
  request_method TEXT NOT NULL,
  request_headers_json TEXT NOT NULL DEFAULT '{}',
  request_body TEXT,
  http_status_code INTEGER,
  duration_ms INTEGER,
  response_headers_json TEXT NOT NULL DEFAULT '{}',
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  CONSTRAINT execution_logs_cron_job_fk FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id) ON DELETE CASCADE,
  CONSTRAINT execution_logs_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS execution_logs_cron_job_id_idx ON execution_logs (cron_job_id);
CREATE INDEX IF NOT EXISTS execution_logs_user_id_started_at_idx ON execution_logs (user_id, started_at);
`

export function createPostgresConnection(databaseUrl: string): PostgresDatabaseConnection {
  const pgPool = new Pool({
    connectionString: databaseUrl,
  })

  const db = drizzle({ client: pgPool, schema })

  return {
    db,
    pgPool,
    initializeSchema: async () => {
      await pgPool.query(BOOTSTRAP_POSTGRES_DDL)
    },
    close: () => {
      void pgPool.end()
    },
  }
}
