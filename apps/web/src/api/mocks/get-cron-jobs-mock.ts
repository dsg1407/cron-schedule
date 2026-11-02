import { http, HttpResponse } from 'msw'
import type { CronJobItem, GetCronJobsResponse } from '../get-cron-jobs'

export const MOCK_CRON_JOBS: CronJobItem[] = [
  {
    id: 'job-1',
    userId: 'user-1',
    name: 'Backup Database',
    description: 'Backup diário do banco de produção',
    icon: 'database',
    url: 'https://api.empresa.com/backup',
    method: 'POST',
    headers: { 'x-api-key': 'secret' },
    body: '{"full":true}',
    cronExpression: '0 2 * * *',
    timezone: 'America/Sao_Paulo',
    timeoutMs: 30000,
    maxRetries: 1,
    status: 'active',
    lastRunAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    nextRunAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    lastStatus: 'success',
    lastDurationMs: 2300,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-26T02:00:00.000Z',
  },
  {
    id: 'job-2',
    userId: 'user-1',
    name: 'Send Reports',
    description: 'Relatórios semanais por e-mail',
    icon: 'mail',
    url: 'https://api.empresa.com/reports',
    method: 'POST',
    headers: {},
    body: null,
    cronExpression: '0 9 * * 1',
    timezone: 'America/Sao_Paulo',
    timeoutMs: 30000,
    maxRetries: 1,
    status: 'active',
    lastRunAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    nextRunAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    lastStatus: 'success',
    lastDurationMs: 3700,
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-20T09:00:00.000Z',
  },
  {
    id: 'job-3',
    userId: 'user-1',
    name: 'Update Analytics',
    description: 'Atualização de métricas consolidadas',
    icon: 'chart',
    url: 'https://api.empresa.com/analytics',
    method: 'POST',
    headers: {},
    body: null,
    cronExpression: '0 */2 * * *',
    timezone: 'America/Sao_Paulo',
    timeoutMs: 30000,
    maxRetries: 1,
    status: 'paused',
    lastRunAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    nextRunAt: null,
    lastStatus: 'success',
    lastDurationMs: 2100,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-26T17:30:00.000Z',
  },
]

export const getCronJobsMock = http.get('*/api/cron-jobs', ({ request }) => {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')?.toLowerCase() ?? ''
  const status = url.searchParams.get('status') ?? ''

  const filtered = MOCK_CRON_JOBS.filter((cronJob) => {
    if (status && cronJob.status !== status) return false
    if (search) {
      return (
        cronJob.name.toLowerCase().includes(search) ||
        (cronJob.description?.toLowerCase().includes(search) ?? false) ||
        cronJob.url.toLowerCase().includes(search)
      )
    }
    return true
  })

  const response: GetCronJobsResponse = {
    cronJobs: filtered,
    meta: {
      pageIndex: 0,
      perPage: 20,
      totalCount: filtered.length,
    },
  }

  return HttpResponse.json(response)
})
