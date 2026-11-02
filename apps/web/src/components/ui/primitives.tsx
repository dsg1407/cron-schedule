import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { type VariantProps, tv } from 'tailwind-variants'

export const badgeVariants = tv({
  base: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border text-foreground',
      success: 'bg-status-success-bg text-status-success-text',
      danger: 'bg-status-danger-bg text-status-danger-text',
      info: 'bg-status-info-bg text-status-info-text',
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
})

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={badgeVariants({ variant, className })} {...props} />
}

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={twMerge('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export function Separator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="separator"
      className={twMerge('h-px w-full bg-border', className)}
      {...props}
    />
  )
}

export function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      data-slot="spinner"
      viewBox="0 0 24 24"
      fill="none"
      className={twMerge('size-4 animate-spin text-current', className)}
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function Empty({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={twMerge(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center',
        className,
      )}
      {...props}
    />
  )
}
