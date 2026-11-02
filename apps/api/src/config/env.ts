import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(8).default('cronflow-super-secret-jwt-key-2026'),
  ALLOW_PRIVATE_NETWORKS: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === 'true') return true
      if (value === 'false') return false
      return undefined
    }),
})

export type DatabaseProvider = 'sqlite' | 'postgres'

export interface Env {
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  HOST: string
  DATABASE_PROVIDER: DatabaseProvider
  DATABASE_URL: string
  JWT_SECRET: string
  ALLOW_PRIVATE_NETWORKS: boolean
}

function isPostgresUrl(url: string): boolean {
  return url.startsWith('postgres://') || url.startsWith('postgresql://')
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment variables: ${issues}`)
  }

  const nodeEnv = parsed.data.NODE_ENV
  const rawDatabaseUrl = parsed.data.DATABASE_URL?.trim()

  const defaultDatabaseUrl =
    nodeEnv === 'production'
      ? 'postgresql://postgres:postgres@localhost:5432/cronflow'
      : './data/cronflow.db'

  const resolvedDatabaseUrl =
    rawDatabaseUrl && rawDatabaseUrl.length > 0 ? rawDatabaseUrl : defaultDatabaseUrl

  if (nodeEnv === 'production' && !isPostgresUrl(resolvedDatabaseUrl)) {
    throw new Error(
      'Invalid environment variables: DATABASE_URL: Em ambiente production, DATABASE_URL deve ser uma URL PostgreSQL (postgres:// ou postgresql://).',
    )
  }

  const databaseProvider: DatabaseProvider =
    nodeEnv === 'production' || isPostgresUrl(resolvedDatabaseUrl) ? 'postgres' : 'sqlite'

  const allowPrivateNetworks = parsed.data.ALLOW_PRIVATE_NETWORKS ?? nodeEnv !== 'production'

  return {
    NODE_ENV: nodeEnv,
    PORT: parsed.data.PORT,
    HOST: parsed.data.HOST,
    DATABASE_PROVIDER: databaseProvider,
    DATABASE_URL: resolvedDatabaseUrl,
    JWT_SECRET: parsed.data.JWT_SECRET,
    ALLOW_PRIVATE_NETWORKS: allowPrivateNetworks,
  }
}
