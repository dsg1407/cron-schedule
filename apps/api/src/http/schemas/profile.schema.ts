import { z } from 'zod'

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  defaultTimezone: z.string(),
  defaultTimeoutMs: z.number().int(),
  defaultMaxRetries: z.number().int(),
  retentionDays: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const updateUserSettingsBodySchema = z.object({
  name: z.string().min(2).optional(),
  defaultTimezone: z.string().min(1).optional(),
  defaultTimeoutMs: z.number().int().min(1000).max(120000).optional(),
  defaultMaxRetries: z.number().int().min(0).max(5).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
})
