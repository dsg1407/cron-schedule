import type { WithStringClassName } from '@/lib/component-props'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { twMerge } from 'tailwind-merge'

export function Tabs(props: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />
}

export function TabsList({ className, ...props }: WithStringClassName<TabsPrimitive.List.Props>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={twMerge(
        'inline-flex items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: WithStringClassName<TabsPrimitive.Tab.Props>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={twMerge(
        'inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:bg-surface data-[selected]:text-foreground data-[selected]:shadow-2xs',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: WithStringClassName<TabsPrimitive.Panel.Props>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={twMerge('mt-3 outline-none', className)}
      {...props}
    />
  )
}
