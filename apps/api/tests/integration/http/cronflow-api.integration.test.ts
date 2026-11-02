import { type Server, createServer } from 'node:http'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../../src/app.js'
import { type AppDependencies, makeApplication } from '../../../src/factories/make-application.js'

describe('CronFlow HTTP API + SQLite Integration', () => {
  let application: AppDependencies
  let app: FastifyInstance
  let targetHttpServer: Server
  let targetServerBaseUrl: string

  beforeAll(async () => {
    targetHttpServer = createServer((incomingRequest, serverResponse) => {
      if (incomingRequest.url === '/webhook-ok') {
        const customHeader = incomingRequest.headers['x-cronflow-token'] ?? 'missing'
        serverResponse.writeHead(200, {
          'Content-Type': 'application/json',
          'X-Echo-Token': String(customHeader),
        })
        serverResponse.end(JSON.stringify({ status: 'processed', echoedToken: customHeader }))
        return
      }

      serverResponse.writeHead(502, { 'Content-Type': 'application/json' })
      serverResponse.end(JSON.stringify({ error: 'Upstream gateway error' }))
    })

    await new Promise<void>((resolve) => {
      targetHttpServer.listen(0, '127.0.0.1', () => resolve())
    })

    const address = targetHttpServer.address()
    const port = typeof address === 'object' && address ? address.port : 0
    targetServerBaseUrl = `http://127.0.0.1:${port}`

    application = makeApplication({
      NODE_ENV: 'test',
      PORT: 0,
      HOST: '127.0.0.1',
      DATABASE_PROVIDER: 'sqlite',
      DATABASE_URL: ':memory:',
      JWT_SECRET: 'integration-test-jwt-secret-key',
      ALLOW_PRIVATE_NETWORKS: true,
    })

    app = await buildApp(application, { logger: false })
  })

  afterAll(async () => {
    application.shutdown()
    await app.close()
    await new Promise<void>((resolve) => targetHttpServer.close(() => resolve()))
  })

  it('completes full lifecycle: register -> create cronjob -> trigger execution -> inspect history & dashboard', async () => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Diego Goncalves',
        email: 'diego@cronflow.dev',
        password: 'password123',
      },
    })

    expect(registerResponse.statusCode).toBe(201)
    const { token, user } = registerResponse.json<{
      token: string
      user: { id: string; email: string }
    }>()
    expect(token).toBeTruthy()
    expect(user.email).toBe('diego@cronflow.dev')

    const createJobResponse = await app.inject({
      method: 'POST',
      url: '/api/cron-jobs',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Backup Database',
        description: 'Daily database backup',
        icon: 'database',
        url: `${targetServerBaseUrl}/webhook-ok`,
        method: 'POST',
        headers: {
          'x-cronflow-token': 'sec-9988',
        },
        body: '{"database":"production"}',
        cronExpression: '0 2 * * *',
        timezone: 'America/Sao_Paulo',
        timeoutMs: 5000,
        maxRetries: 0,
        status: 'active',
      },
    })

    expect(createJobResponse.statusCode).toBe(201)
    const { cronJob } = createJobResponse.json<{ cronJob: { id: string; status: string } }>()
    expect(cronJob.id).toBeTruthy()
    expect(cronJob.status).toBe('active')

    const triggerResponse = await app.inject({
      method: 'POST',
      url: `/api/cron-jobs/${cronJob.id}/trigger`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    expect(triggerResponse.statusCode).toBe(200)
    const triggerData = triggerResponse.json<{
      execution: {
        id: string
        status: string
        httpStatusCode: number
        responseBody: string
        responseHeaders: Record<string, string>
      }
    }>()

    expect(triggerData.execution.status).toBe('success')
    expect(triggerData.execution.httpStatusCode).toBe(200)
    expect(triggerData.execution.responseHeaders['x-echo-token']).toBe('sec-9988')
    expect(triggerData.execution.responseBody).toContain('"echoedToken":"sec-9988"')

    const executionDetailsResponse = await app.inject({
      method: 'GET',
      url: `/api/executions/${triggerData.execution.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    expect(executionDetailsResponse.statusCode).toBe(200)
    const detailsData = executionDetailsResponse.json<{
      execution: { id: string; cronJobName: string }
    }>()
    expect(detailsData.execution.cronJobName).toBe('Backup Database')

    const dashboardResponse = await app.inject({
      method: 'GET',
      url: '/api/dashboard/summary',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    expect(dashboardResponse.statusCode).toBe(200)
    const dashboardData = dashboardResponse.json<{
      summary: {
        totalCronJobs: number
        executionsLast24h: number
        successRatePercent: number
      }
    }>()
    expect(dashboardData.summary.totalCronJobs).toBe(1)
    expect(dashboardData.summary.executionsLast24h).toBe(1)
    expect(dashboardData.summary.successRatePercent).toBe(100)
  })
})
