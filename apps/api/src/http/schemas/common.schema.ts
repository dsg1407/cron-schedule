import { z } from 'zod'

export const errorResponseSchema = z.object({
  status: z.number().int(),
  error: z.string(),
  message: z.string(),
  timestamp: z.string(),
  path: z.string(),
})

export const paginationMetaSchema = z.object({
  pageIndex: z.number().int(),
  perPage: z.number().int(),
  totalCount: z.number().int(),
})
