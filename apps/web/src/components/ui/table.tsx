import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export interface TableProps extends ComponentProps<'table'> {
  regionLabel?: string
}

export function Table({ className, regionLabel = 'Tabela de dados', ...props }: TableProps) {
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable table region per modern-web-guidance responsive-table
      tabIndex={0}
      aria-label={regionLabel}
      data-slot="table-wrapper"
      className="relative isolate max-w-full overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table
        data-slot="table"
        className={twMerge('w-full border-separate border-spacing-0 text-left text-sm', className)}
        {...props}
      />
    </section>
  )
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={twMerge('sticky top-0 bg-surface', className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={twMerge('[&_tr:last-child_td]:border-b-0', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={twMerge('transition-colors hover:bg-muted/50', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={twMerge(
        'border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={twMerge('border-b border-border px-4 py-3.5 align-middle', className)}
      {...props}
    />
  )
}
