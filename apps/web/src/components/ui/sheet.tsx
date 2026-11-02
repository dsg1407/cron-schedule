import type { WithStringClassName } from '@/lib/component-props'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

export function SheetTrigger({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Trigger.Props>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" className={className} {...props} />
}

export function SheetContent({
  className,
  children,
  ...props
}: WithStringClassName<SheetPrimitive.Popup.Props>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className="fixed inset-0 bg-foreground/40 backdrop-blur-[1px] transition-opacity"
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <SheetPrimitive.Popup
          data-slot="sheet-content"
          className={twMerge(
            'relative flex h-full w-screen max-w-2xl flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-6 text-foreground shadow-xl outline-none',
            className,
          )}
          {...props}
        >
          {children}
          <SheetPrimitive.Close
            aria-label="Fechar painel"
            className="absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </SheetPrimitive.Close>
        </SheetPrimitive.Popup>
      </div>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={twMerge('flex flex-col gap-1 pr-8', className)}
      {...props}
    />
  )
}

export function SheetTitle({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Title.Props>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={twMerge('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function SheetDescription({
  className,
  ...props
}: WithStringClassName<SheetPrimitive.Description.Props>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={twMerge('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
