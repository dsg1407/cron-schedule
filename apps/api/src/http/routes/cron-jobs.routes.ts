import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { CreateCronJobUseCase } from '../../application/use-cases/create-cron-job.use-case.js'
import type { DeleteCronJobUseCase } from '../../application/use-cases/delete-cron-job.use-case.js'
import type { ExecuteCronJobUseCase } from '../../application/use-cases/execute-cron-job.use-case.js'
import type { GetCronJobUseCase } from '../../application/use-cases/get-cron-job.use-case.js'
import type { ListCronJobsUseCase } from '../../application/use-cases/list-cron-jobs.use-case.js'
import type { ToggleCronJobStatusUseCase } from '../../application/use-cases/toggle-cron-job-status.use-case.js'
import type { UpdateCronJobUseCase } from '../../application/use-cases/update-cron-job.use-case.js'
import { presentCronJob } from '../presenters/cron-job.presenter.js'
import { presentExecutionLog } from '../presenters/execution.presenter.js'
import { errorResponseSchema } from '../schemas/common.schema.js'
import {
  createCronJobBodySchema,
  cronJobParamsSchema,
  cronJobResponseSchema,
  listCronJobsQuerySchema,
  listCronJobsResponseSchema,
  toggleCronJobStatusBodySchema,
  updateCronJobBodySchema,
} from '../schemas/cron-job.schema.js'
import { triggerCronJobResponseSchema } from '../schemas/execution.schema.js'

export interface CronJobsRoutesDependencies {
  listCronJobsUseCase: ListCronJobsUseCase
  getCronJobUseCase: GetCronJobUseCase
  createCronJobUseCase: CreateCronJobUseCase
  updateCronJobUseCase: UpdateCronJobUseCase
  toggleCronJobStatusUseCase: ToggleCronJobStatusUseCase
  deleteCronJobUseCase: DeleteCronJobUseCase
  executeCronJobUseCase: ExecuteCronJobUseCase
}

export async function registerCronJobsRoutes(
  app: FastifyInstance,
  dependencies: CronJobsRoutesDependencies,
): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.get(
    '/api/cron-jobs',
    {
      schema: {
        tags: ['cron-jobs'],
        querystring: listCronJobsQuerySchema,
        response: {
          200: listCronJobsResponseSchema,
        },
      },
    },
    async (request) => {
      const { cronJobs, meta } = await dependencies.listCronJobsUseCase.execute({
        userId: request.user.sub,
        search: request.query.search,
        status: request.query.status,
        pageIndex: request.query.pageIndex,
        perPage: request.query.perPage,
      })

      return {
        cronJobs: cronJobs.map((cronJob) => presentCronJob(cronJob)),
        meta,
      }
    },
  )

  typedApp.get(
    '/api/cron-jobs/:cronJobId',
    {
      schema: {
        tags: ['cron-jobs'],
        params: cronJobParamsSchema,
        response: {
          200: z.object({ cronJob: cronJobResponseSchema }),
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { cronJob } = await dependencies.getCronJobUseCase.execute({
        cronJobId: request.params.cronJobId,
        userId: request.user.sub,
      })

      return { cronJob: presentCronJob(cronJob) }
    },
  )

  typedApp.post(
    '/api/cron-jobs',
    {
      schema: {
        tags: ['cron-jobs'],
        body: createCronJobBodySchema,
        response: {
          201: z.object({ cronJob: cronJobResponseSchema }),
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { cronJob } = await dependencies.createCronJobUseCase.execute({
        userId: request.user.sub,
        ...request.body,
      })

      return reply.status(201).send({ cronJob: presentCronJob(cronJob) })
    },
  )

  typedApp.put(
    '/api/cron-jobs/:cronJobId',
    {
      schema: {
        tags: ['cron-jobs'],
        params: cronJobParamsSchema,
        body: updateCronJobBodySchema,
        response: {
          200: z.object({ cronJob: cronJobResponseSchema }),
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { cronJob } = await dependencies.updateCronJobUseCase.execute({
        cronJobId: request.params.cronJobId,
        userId: request.user.sub,
        ...request.body,
      })

      return { cronJob: presentCronJob(cronJob) }
    },
  )

  typedApp.patch(
    '/api/cron-jobs/:cronJobId/status',
    {
      schema: {
        tags: ['cron-jobs'],
        params: cronJobParamsSchema,
        body: toggleCronJobStatusBodySchema,
        response: {
          200: z.object({ cronJob: cronJobResponseSchema }),
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { cronJob } = await dependencies.toggleCronJobStatusUseCase.execute({
        cronJobId: request.params.cronJobId,
        userId: request.user.sub,
        status: request.body.status,
      })

      return { cronJob: presentCronJob(cronJob) }
    },
  )

  typedApp.post(
    '/api/cron-jobs/:cronJobId/trigger',
    {
      schema: {
        tags: ['cron-jobs'],
        params: cronJobParamsSchema,
        response: {
          200: triggerCronJobResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { executionLog, cronJob } = await dependencies.executeCronJobUseCase.execute({
        cronJobId: request.params.cronJobId,
        userId: request.user.sub,
        triggerType: 'manual',
      })

      return {
        execution: presentExecutionLog(executionLog),
        cronJob: presentCronJob(cronJob),
      }
    },
  )

  typedApp.delete(
    '/api/cron-jobs/:cronJobId',
    {
      schema: {
        tags: ['cron-jobs'],
        params: cronJobParamsSchema,
        response: {
          204: z.null(),
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await dependencies.deleteCronJobUseCase.execute({
        cronJobId: request.params.cronJobId,
        userId: request.user.sub,
      })

      return reply.status(204).send(null)
    },
  )
}
