import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="field-group" className={twMerge('flex flex-col gap-4', className)} {...props} />
  )
}

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field"
      className={twMerge('group/field flex flex-col gap-1.5 data-[disabled]:opacity-60', className)}
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: primitive label wrapper forwards htmlFor via props
    <label
      data-slot="field-label"
      className={twMerge(
        'text-xs font-medium text-foreground group-data-[invalid]/field:text-destructive',
        className,
      )}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={twMerge(
        'text-xs text-muted-foreground group-data-[invalid]/field:text-destructive',
        className,
      )}
      {...props}
    />
  )
}

export function FieldSet({ className, ...props }: ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={twMerge('flex flex-col gap-3 rounded-lg border border-border p-3.5', className)}
      {...props}
    />
  )
}

export function FieldLegend({ className, ...props }: ComponentProps<'legend'>) {
  return (
    <legend
      data-slot="field-legend"
      className={twMerge('px-1 text-xs font-semibold text-foreground', className)}
      {...props}
    />
  )
}
