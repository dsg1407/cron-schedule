import type { WithStringClassName } from '@/lib/component-props'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Trigger.Props>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" className={className} {...props} />
}

export function DialogClose({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Close.Props>) {
  return <DialogPrimitive.Close data-slot="dialog-close" className={className} {...props} />
}

export function DialogContent({
  className,
  children,
  ...props
}: WithStringClassName<DialogPrimitive.Popup.Props>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className="fixed inset-0 bg-foreground/40 backdrop-blur-[1px] transition-opacity"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={twMerge(
            'relative flex max-h-[90vh] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-surface p-6 text-foreground shadow-lg outline-none',
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            aria-label="Fechar modal"
            className="absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </div>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={twMerge('flex flex-col gap-1 pr-8', className)}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Title.Props>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={twMerge('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: WithStringClassName<DialogPrimitive.Description.Props>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={twMerge('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={twMerge('flex items-center justify-end gap-2.5 pt-2', className)}
      {...props}
    />
  )
}
