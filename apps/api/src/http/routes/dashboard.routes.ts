import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case.js'
import { presentExecutionLog } from '../presenters/execution.presenter.js'
import { dashboardSummaryResponseSchema } from '../schemas/dashboard.schema.js'

export interface DashboardRoutesDependencies {
  getDashboardMetricsUseCase: GetDashboardMetricsUseCase
}

export async function registerDashboardRoutes(
  app: FastifyInstance,
  dependencies: DashboardRoutesDependencies,
): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/api/dashboard/summary',
    {
      schema: {
        tags: ['dashboard'],
        response: {
          200: dashboardSummaryResponseSchema,
        },
      },
    },
    async (request) => {
      const { summary } = await dependencies.getDashboardMetricsUseCase.execute({
        userId: request.user.sub,
      })

      return {
        summary: {
          ...summary,
          recentActivity: summary.recentActivity.map((executionLog) =>
            presentExecutionLog(executionLog),
          ),
        },
      }
    },
  )
}
