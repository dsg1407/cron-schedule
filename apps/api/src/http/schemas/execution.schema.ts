import { z } from 'zod'
import { paginationMetaSchema } from './common.schema.js'
import {
  cronJobResponseSchema,
  executionOutcomeSchema,
  httpMethodSchema,
} from './cron-job.schema.js'

export const triggerTypeSchema = z.enum(['scheduled', 'manual'])

export const executionParamsSchema = z.object({
  executionId: z.string().min(1),
})

export const listExecutionsQuerySchema = z.object({
  cronJobId: z.string().optional(),
  status: executionOutcomeSchema.optional(),
  triggerType: triggerTypeSchema.optional(),
  search: z.string().optional(),
  pageIndex: z.coerce.number().int().min(0).default(0),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

export const purgeExecutionsBodySchema = z.object({
  olderThanDays: z.coerce.number().int().min(0).max(365).default(30),
})

export const executionLogResponseSchema = z.object({
  id: z.string(),
  cronJobId: z.string(),
  cronJobName: z.string().optional(),
  cronJobIcon: z.string().optional(),
  userId: z.string(),
  triggerType: triggerTypeSchema,
  status: executionOutcomeSchema,
  requestUrl: z.string(),
  requestMethod: httpMethodSchema,
  requestHeaders: z.record(z.string(), z.string()),
  requestBody: z.string().nullable(),
  httpStatusCode: z.number().int().nullable(),
  durationMs: z.number().int().nullable(),
  responseHeaders: z.record(z.string(), z.string()),
  responseBody: z.string().nullable(),
  errorMessage: z.string().nullable(),
  attemptCount: z.number().int(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
})

export const listExecutionsResponseSchema = z.object({
  executions: z.array(executionLogResponseSchema),
  meta: paginationMetaSchema,
})

export const triggerCronJobResponseSchema = z.object({
  execution: executionLogResponseSchema,
  cronJob: cronJobResponseSchema,
})
