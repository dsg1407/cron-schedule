import type { WithStringClassName } from '@/lib/component-props'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { twMerge } from 'tailwind-merge'

export function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

export function DropdownMenuTrigger({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Trigger.Props>) {
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={twMerge(
        'inline-flex cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: WithStringClassName<MenuPrimitive.Popup.Props> &
  Pick<MenuPrimitive.Positioner.Props, 'sideOffset'>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner sideOffset={sideOffset} className="outline-none">
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={twMerge(
            'min-w-44 rounded-xl border border-border bg-surface-raised p-1.5 text-foreground shadow-lg outline-none',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

export function DropdownMenuGroup({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Group.Props>) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" className={className} {...props} />
}

export function DropdownMenuItem({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Item.Props>) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={twMerge(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: WithStringClassName<MenuPrimitive.Separator.Props>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={twMerge('my-1 h-px bg-border', className)}
      {...props}
    />
  )
}
