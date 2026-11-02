import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={twMerge(
        'flex h-9 w-full rounded-lg border border-input bg-surface px-3 py-1.5 text-sm text-foreground shadow-2xs transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={twMerge(
        'flex min-h-20 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-2xs transition-colors',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      className={twMerge(
        'relative flex h-9 w-full items-center rounded-lg border border-input bg-surface shadow-2xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupAddon({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group-addon"
      className={twMerge(
        'flex items-center justify-center px-2.5 text-muted-foreground [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input-group-input"
      className={twMerge(
        'h-full w-full bg-transparent pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
