import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

export const statusBadgeVariants = tv({
  slots: {
    base: 'inline-flex items-center rounded-full font-medium',
    dot: 'shrink-0 rounded-full',
  },
  variants: {
    status: {
      active: {
        base: 'bg-status-success-bg text-status-success-text',
        dot: 'bg-status-success-dot',
      },
      paused: {
        base: 'bg-status-pending-bg text-status-pending-text',
        dot: 'bg-status-pending-dot',
      },
      success: {
        base: 'bg-status-success-bg text-status-success-text',
        dot: 'bg-status-success-dot',
      },
      failed: {
        base: 'bg-status-danger-bg text-status-danger-text',
        dot: 'bg-status-danger-dot',
      },
      running: {
        base: 'bg-status-info-bg text-status-info-text',
        dot: 'bg-status-info-dot animate-pulse',
      },
    },
    size: {
      sm: { base: 'gap-1.5 px-2.5 py-0.5 text-xs', dot: 'size-1.5' },
      md: { base: 'gap-2 px-3 py-1 text-xs', dot: 'size-2' },
    },
  },
  defaultVariants: {
    status: 'active',
    size: 'sm',
  },
})

export const STATUS_LABELS: Record<
  NonNullable<VariantProps<typeof statusBadgeVariants>['status']>,
  string
> = {
  active: 'Ativo',
  paused: 'Pausado',
  success: 'Sucesso',
  failed: 'Falhou',
  running: 'Executando',
}

export interface StatusBadgeProps
  extends ComponentProps<'span'>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({
  status = 'active',
  size,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const { base, dot } = statusBadgeVariants({ status, size })
  return (
    <span data-slot="status-badge" className={base({ className })} {...props}>
      <span data-slot="status-badge-dot" aria-hidden="true" className={dot()} />
      {children ?? STATUS_LABELS[status]}
    </span>
  )
}
