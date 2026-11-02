import { z } from 'zod'
import { executionLogResponseSchema } from './execution.schema.js'

export const dashboardSummaryResponseSchema = z.object({
  summary: z.object({
    totalCronJobs: z.number().int(),
    activeCronJobs: z.number().int(),
    executionsLast24h: z.number().int(),
    successRatePercent: z.number(),
    averageDurationMs: z.number(),
    hourlySeries: z.array(
      z.object({
        hourLabel: z.string(),
        executionsCount: z.number().int(),
        successRatePercent: z.number(),
        averageDurationMs: z.number(),
      }),
    ),
    recentActivity: z.array(executionLogResponseSchema),
  }),
})
