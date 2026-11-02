import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders active status label in Portuguese', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('renders paused status label in Portuguese', () => {
    render(<StatusBadge status="paused" />)
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('renders failed status label in Portuguese', () => {
    render(<StatusBadge status="failed" />)
    expect(screen.getByText('Falhou')).toBeInTheDocument()
  })
})
