import { http, HttpResponse } from 'msw'
import type { GetDashboardSummaryResponse } from '../get-dashboard-summary'

export const getDashboardSummaryMock = http.get('*/api/dashboard/summary', () => {
  const response: GetDashboardSummaryResponse = {
    summary: {
      totalCronJobs: 5,
      activeCronJobs: 4,
      executionsLast24h: 12,
      successRatePercent: 100,
      averageDurationMs: 120000,
      hourlySeries: [
        {
          hourLabel: '03:00',
          executionsCount: 1,
          successRatePercent: 100,
          averageDurationMs: 1800,
        },
        {
          hourLabel: '06:00',
          executionsCount: 2,
          successRatePercent: 100,
          averageDurationMs: 2100,
        },
        {
          hourLabel: '09:00',
          executionsCount: 3,
          successRatePercent: 100,
          averageDurationMs: 1950,
        },
        {
          hourLabel: '12:00',
          executionsCount: 2,
          successRatePercent: 100,
          averageDurationMs: 2400,
        },
        {
          hourLabel: '15:00',
          executionsCount: 4,
          successRatePercent: 100,
          averageDurationMs: 2200,
        },
      ],
      recentActivity: [
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
          triggerType: 'scheduled',
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
    },
  }

  return HttpResponse.json(response)
})
