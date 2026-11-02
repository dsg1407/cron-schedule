import { loadEnv } from '../../config/env.js'
import { createPostgresConnection } from './postgres/client.js'
import { createSqliteConnection } from './sqlite/client.js'

async function runMigrations(): Promise<void> {
  const env = loadEnv(process.env)

  if (env.DATABASE_PROVIDER === 'postgres') {
    const pgConnection = createPostgresConnection(env.DATABASE_URL)
    try {
      await pgConnection.initializeSchema()
      console.log('[CronFlow] PostgreSQL schema verified and migrated.')
    } finally {
      pgConnection.close()
    }
    return
  }

  const sqliteConnection = createSqliteConnection(env.DATABASE_URL)
  sqliteConnection.close()
  console.log(`[CronFlow] SQLite schema verified at ${env.DATABASE_URL}.`)
}

void runMigrations()
