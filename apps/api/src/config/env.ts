import { z } from 'zod'

export const DEFAULT_JWT_SECRET = 'cronflow-super-secret-jwt-key-2026'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(8).default(DEFAULT_JWT_SECRET),
  ALLOW_PRIVATE_NETWORKS: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === 'true') return true
      if (value === 'false') return false
      return undefined
    }),
  CORS_ORIGIN: z.string().optional(),
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
  CORS_ORIGIN: boolean | string | string[]
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

  if (nodeEnv === 'production') {
    if (!parsed.data.JWT_SECRET || parsed.data.JWT_SECRET === DEFAULT_JWT_SECRET) {
      throw new Error(
        'Invalid environment variables: JWT_SECRET: Em ambiente production, JWT_SECRET deve ser configurado com uma chave personalizada e não pode utilizar o valor padrão.',
      )
    }
    if (parsed.data.JWT_SECRET.length < 32) {
      throw new Error(
        'Invalid environment variables: JWT_SECRET: Em ambiente production, JWT_SECRET deve conter no mínimo 32 caracteres.',
      )
    }
  }

  const databaseProvider: DatabaseProvider =
    nodeEnv === 'production' || isPostgresUrl(resolvedDatabaseUrl) ? 'postgres' : 'sqlite'

  const allowPrivateNetworks = parsed.data.ALLOW_PRIVATE_NETWORKS ?? nodeEnv !== 'production'

  let corsOrigin: boolean | string | string[] = true
  if (parsed.data.CORS_ORIGIN) {
    const rawOrigin = parsed.data.CORS_ORIGIN.trim()
    if (rawOrigin === 'true') {
      corsOrigin = true
    } else if (rawOrigin === 'false') {
      corsOrigin = false
    } else if (rawOrigin.includes(',')) {
      corsOrigin = rawOrigin.split(',').map((o) => o.trim())
    } else {
      corsOrigin = rawOrigin
    }
  } else if (nodeEnv === 'production') {
    corsOrigin = false
  } else {
    corsOrigin = true
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: parsed.data.PORT,
    HOST: parsed.data.HOST,
    DATABASE_PROVIDER: databaseProvider,
    DATABASE_URL: resolvedDatabaseUrl,
    JWT_SECRET: parsed.data.JWT_SECRET,
    ALLOW_PRIVATE_NETWORKS: allowPrivateNetworks,
    CORS_ORIGIN: corsOrigin,
  }
}
