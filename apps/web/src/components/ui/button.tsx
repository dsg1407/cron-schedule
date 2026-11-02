import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

export const buttonVariants = tv({
  base: [
    'inline-flex cursor-pointer items-center justify-center rounded-lg border font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 disabled:pointer-events-none disabled:opacity-50',
    '[&_svg[data-icon=inline-start]]:mr-1.5 [&_svg[data-icon=inline-end]]:ml-1.5',
  ],
  variants: {
    variant: {
      primary: 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs',
      secondary: 'border-border bg-secondary text-secondary-foreground hover:bg-muted',
      outline: 'border-border bg-surface text-foreground hover:bg-muted',
      ghost:
        'border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
      destructive:
        'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    size: {
      sm: 'h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5',
      md: 'h-9 gap-2 px-3.5 text-sm [&_svg]:size-4',
      lg: 'h-10 gap-2.5 px-4 text-sm [&_svg]:size-4',
      icon: 'size-9 p-0 [&_svg]:size-4',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, disabled, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      data-slot="button"
      data-disabled={disabled ? '' : undefined}
      disabled={disabled}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}
