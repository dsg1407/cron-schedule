import { getCronJobsMock } from '@/api/mocks/get-cron-jobs-mock'
import { getDashboardSummaryMock } from '@/api/mocks/get-dashboard-summary-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Dashboard } from './dashboard'

const mswServer = setupServer(getDashboardSummaryMock, getCronJobsMock)

beforeAll(() => mswServer.listen())
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe('Dashboard Page', () => {
  it('renders KPI metrics, cronjobs table and recent activity from MSW handlers', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(<Dashboard />, {
      wrapper: ({ children }) => (
        <MemoryRouter>
          <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
        </MemoryRouter>
      ),
    })

    await waitFor(() => {
      expect(screen.getByTestId('kpi-total-jobs')).toHaveTextContent('5')
    })

    expect(screen.getByTestId('kpi-executions-24h')).toHaveTextContent('12')
    expect(screen.getByTestId('kpi-success-rate')).toHaveTextContent('100%')
    expect(screen.getByText('Backup Database')).toBeInTheDocument()
    expect(screen.getByText('Send Reports')).toBeInTheDocument()
    expect(screen.getByText('Sync External API falhou')).toBeInTheDocument()
  })
})
