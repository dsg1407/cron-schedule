import { http, HttpResponse } from 'msw'
import type { GetExecutionsResponse } from '../get-executions'
import type { GetProfileResponse } from '../get-profile'

export const getExecutionsMock = http.get('*/api/executions', () => {
  const response: GetExecutionsResponse = {
    executions: [
      {
        id: 'exec-1',
        cronJobId: 'job-1',
        cronJobName: 'Backup Database',
        cronJobIcon: 'database',
        userId: 'user-1',
        triggerType: 'scheduled',
        status: 'success',
        requestUrl: 'https://api.empresa.com/backup',
        requestMethod: 'POST',
        requestHeaders: { 'x-api-key': 'secret' },
        requestBody: '{"full":true}',
        httpStatusCode: 200,
        durationMs: 2300,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: '{"ok":true,"snapshot":"snap-01"}',
        errorMessage: null,
        attemptCount: 1,
        startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        finishedAt: new Date(Date.now() - 2 * 3600 * 1000 + 2300).toISOString(),
      },
      {
        id: 'exec-2',
        cronJobId: 'job-2',
        cronJobName: 'Sync External API',
        cronJobIcon: 'refresh',
        userId: 'user-1',
        triggerType: 'manual',
        status: 'failed',
        requestUrl: 'https://partner.example.com/sync',
        requestMethod: 'POST',
        requestHeaders: {},
        requestBody: null,
        httpStatusCode: 502,
        durationMs: 12400,
        responseHeaders: {},
        responseBody: '{"error":"Bad Gateway"}',
        errorMessage: 'Serviço respondeu com status HTTP 502 (Bad Gateway).',
        attemptCount: 2,
        startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        finishedAt: new Date(Date.now() - 3600 * 1000 + 12400).toISOString(),
      },
    ],
    meta: {
      pageIndex: 0,
      perPage: 20,
      totalCount: 2,
    },
  }

  return HttpResponse.json(response)
})

export const getProfileMock = http.get('*/api/me', () => {
  const response: GetProfileResponse = {
    user: {
      id: 'user-1',
      name: 'Diego Gonçalves',
      email: 'diego@cronflow.dev',
      defaultTimezone: 'America/Sao_Paulo',
      defaultTimeoutMs: 30000,
      defaultMaxRetries: 1,
      retentionDays: 30,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
    },
  }

  return HttpResponse.json(response)
})

export const handlers = [getExecutionsMock, getProfileMock]
