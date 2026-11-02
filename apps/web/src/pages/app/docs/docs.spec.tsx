import { buildPixBrCode } from '@/components/donation-dialog'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Docs } from './docs'

describe('Docs Page (/docs) & Donation', () => {
  it('renders technical copy, HTTP headers contract, cron presets table, exclusive details FAQ, and donation modal', () => {
    const { container } = render(<Docs />, {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/docs']}>{children}</MemoryRouter>,
    })

    expect(
      screen.getByRole('heading', {
        name: /Agende chamadas HTTP com retentativas automáticas/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('X-CronFlow-Job-Id')).toBeInTheDocument()
    expect(screen.getByText('*/5 * * * *')).toBeInTheDocument()
    expect(screen.getByText('30 8 * * 1-5')).toBeInTheDocument()

    const detailsElements = container.querySelectorAll('details[name="docs-faq"]')
    expect(detailsElements.length).toBe(5)

    // Verify Donation section and modal trigger
    expect(screen.getByText(/Apoie a evolução do CronFlow/i)).toBeInTheDocument()
    const qrButton = screen.getByRole('button', { name: /QR Code PIX & BRCode/i })
    fireEvent.click(qrButton)

    expect(screen.getByText(/Apoie o desenvolvimento do CronFlow/i)).toBeInTheDocument()
    expect(screen.getByText('dsg1407@gmail.com')).toBeInTheDocument()
  })

  it('generates a valid EMV-Co PIX BRCode with 4-hex-digit CRC16 checksum', () => {
    const brCode = buildPixBrCode('dsg1407@gmail.com')
    expect(brCode.startsWith('00020126')).toBe(true)
    expect(brCode).toContain('br.gov.bcb.pix')
    expect(brCode).toContain('dsg1407@gmail.com')
    expect(brCode).toMatch(/6304[0-9A-F]{4}$/)
  })
})
