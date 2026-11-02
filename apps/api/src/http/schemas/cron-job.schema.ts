import { z } from 'zod'
import { paginationMetaSchema } from './common.schema.js'

export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
export const cronJobStatusSchema = z.enum(['active', 'paused'])
export const cronJobIconSchema = z.enum(['database', 'mail', 'trash', 'chart', 'refresh', 'globe'])
export const executionOutcomeSchema = z.enum(['success', 'failed', 'running'])

export const cronJobParamsSchema = z.object({
  cronJobId: z.string().min(1),
})

export const listCronJobsQuerySchema = z.object({
  search: z.string().optional(),
  status: cronJobStatusSchema.optional(),
  pageIndex: z.coerce.number().int().min(0).default(0),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

export const createCronJobBodySchema = z.object({
  name: z.string().min(2, 'O nome deve ter ao menos 2 caracteres.'),
  description: z.string().nullable().optional(),
  icon: cronJobIconSchema.default('globe'),
  url: z.string().url('Informe uma URL válida.'),
  method: httpMethodSchema.default('GET'),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.string().nullable().optional(),
  cronExpression: z.string().min(5, 'Informe uma expressão cron válida.'),
  timezone: z.string().default('America/Sao_Paulo'),
  timeoutMs: z.number().int().min(500).max(120000).default(30000),
  maxRetries: z.number().int().min(0).max(5).default(1),
  status: cronJobStatusSchema.default('active'),
})

export const updateCronJobBodySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  icon: cronJobIconSchema.optional(),
  url: z.string().url().optional(),
  method: httpMethodSchema.optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().nullable().optional(),
  cronExpression: z.string().min(5).optional(),
  timezone: z.string().optional(),
  timeoutMs: z.number().int().min(500).max(120000).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
  status: cronJobStatusSchema.optional(),
})

export const toggleCronJobStatusBodySchema = z.object({
  status: cronJobStatusSchema.optional(),
})

export const cronJobResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: cronJobIconSchema,
  url: z.string(),
  method: httpMethodSchema,
  headers: z.record(z.string(), z.string()),
  body: z.string().nullable(),
  cronExpression: z.string(),
  timezone: z.string(),
  timeoutMs: z.number().int(),
  maxRetries: z.number().int(),
  status: cronJobStatusSchema,
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
  lastStatus: executionOutcomeSchema.nullable(),
  lastDurationMs: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const listCronJobsResponseSchema = z.object({
  cronJobs: z.array(cronJobResponseSchema),
  meta: paginationMetaSchema,
})
