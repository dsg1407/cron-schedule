import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { GetExecutionDetailsUseCase } from '../../application/use-cases/get-execution-details.use-case.js'
import type { ListExecutionsUseCase } from '../../application/use-cases/list-executions.use-case.js'
import type { PurgeOldExecutionsUseCase } from '../../application/use-cases/purge-old-executions.use-case.js'
import { presentExecutionLog } from '../presenters/execution.presenter.js'
import { errorResponseSchema } from '../schemas/common.schema.js'
import {
  executionLogResponseSchema,
  executionParamsSchema,
  listExecutionsQuerySchema,
  listExecutionsResponseSchema,
  purgeExecutionsBodySchema,
} from '../schemas/execution.schema.js'

export interface ExecutionsRoutesDependencies {
  listExecutionsUseCase: ListExecutionsUseCase
  getExecutionDetailsUseCase: GetExecutionDetailsUseCase
  purgeOldExecutionsUseCase: PurgeOldExecutionsUseCase
}

export async function registerExecutionsRoutes(
  app: FastifyInstance,
  dependencies: ExecutionsRoutesDependencies,
): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/api/executions',
    {
      schema: {
        tags: ['executions'],
        querystring: listExecutionsQuerySchema,
        response: {
          200: listExecutionsResponseSchema,
        },
      },
    },
    async (request) => {
      const { executions, meta } = await dependencies.listExecutionsUseCase.execute({
        userId: request.user.sub,
        cronJobId: request.query.cronJobId,
        status: request.query.status,
        triggerType: request.query.triggerType,
        search: request.query.search,
        pageIndex: request.query.pageIndex,
        perPage: request.query.perPage,
      })

      return {
        executions: executions.map((executionLog) => presentExecutionLog(executionLog)),
        meta,
      }
    },
  )

  typedApp.get(
    '/api/executions/:executionId',
    {
      schema: {
        tags: ['executions'],
        params: executionParamsSchema,
        response: {
          200: z.object({ execution: executionLogResponseSchema }),
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { execution } = await dependencies.getExecutionDetailsUseCase.execute({
        executionId: request.params.executionId,
        userId: request.user.sub,
      })

      return { execution: presentExecutionLog(execution) }
    },
  )

  typedApp.delete(
    '/api/executions/purge',
    {
      schema: {
        tags: ['executions'],
        querystring: purgeExecutionsBodySchema,
        response: {
          200: z.object({ deletedCount: z.number().int() }),
        },
      },
    },
    async (request) => {
      const { deletedCount } = await dependencies.purgeOldExecutionsUseCase.execute({
        userId: request.user.sub,
        olderThanDays: request.query.olderThanDays,
      })

      return { deletedCount }
    },
  )
}
