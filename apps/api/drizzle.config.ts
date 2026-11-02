import { defineConfig } from 'drizzle-kit'

const isPostgres =
  process.env.NODE_ENV === 'production' ||
  Boolean(
    process.env.DATABASE_URL?.startsWith('postgres://') ||
      process.env.DATABASE_URL?.startsWith('postgresql://'),
  )

export default defineConfig(
  isPostgres
    ? {
        dialect: 'postgresql',
        schema: './src/infra/database/postgres/schema.ts',
        out: './drizzle/postgres',
        dbCredentials: {
          url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/cronflow',
        },
      }
    : {
        dialect: 'sqlite',
        schema: './src/infra/database/sqlite/schema.ts',
        out: './drizzle',
        dbCredentials: {
          url: process.env.DATABASE_URL ?? './data/cronflow.db',
        },
      },
)
