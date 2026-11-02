import { getExecutionsMock } from '@/api/mocks/get-executions-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Executions } from './executions'

const mswServer = setupServer(getExecutionsMock)

beforeAll(() => mswServer.listen())
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe('Executions Page', () => {
  it('renders execution history and opens response inspection drawer', async () => {
    const user = userEvent.setup()
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(<Executions />, {
      wrapper: ({ children }) => (
        <MemoryRouter>
          <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
        </MemoryRouter>
      ),
    })

    await waitFor(() => {
      expect(screen.getByText('Backup Database')).toBeInTheDocument()
    })

    expect(screen.getByText('Sync External API')).toBeInTheDocument()
    expect(screen.getByText('502')).toBeInTheDocument()

    const inspectButtons = screen.getAllByRole('button', { name: /Resposta/i })
    await user.click(inspectButtons[0]!)

    await waitFor(() => {
      expect(screen.getByText(/Telemetria completa da chamada HTTP/i)).toBeInTheDocument()
    })
  })
})
