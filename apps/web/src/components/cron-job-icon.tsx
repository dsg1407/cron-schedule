import {
  BarChart3Icon,
  DatabaseIcon,
  GlobeIcon,
  MailIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

export type CronJobIconType = 'database' | 'mail' | 'trash' | 'chart' | 'refresh' | 'globe'

export const cronJobIconVariants = tv({
  base: 'inline-flex shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
  variants: {
    icon: {
      database: 'bg-status-info-bg text-status-info-text',
      mail: 'bg-status-purple-bg text-status-purple-text',
      trash: 'bg-status-purple-bg text-status-purple-text',
      chart: 'bg-status-info-bg text-status-info-text',
      refresh: 'bg-status-purple-bg text-status-purple-text',
      globe: 'bg-secondary text-foreground-subtle',
    },
    size: {
      sm: 'size-8 [&_svg]:size-4',
      md: 'size-9 [&_svg]:size-4',
    },
  },
  defaultVariants: {
    icon: 'globe',
    size: 'md',
  },
})

export interface CronJobIconBadgeProps
  extends ComponentProps<'div'>,
    VariantProps<typeof cronJobIconVariants> {}

export function CronJobIconBadge({
  icon = 'globe',
  size,
  className,
  ...props
}: CronJobIconBadgeProps) {
  return (
    <div
      data-slot="cron-job-icon"
      aria-hidden="true"
      className={cronJobIconVariants({ icon, size, className })}
      {...props}
    >
      {icon === 'database' && <DatabaseIcon />}
      {icon === 'mail' && <MailIcon />}
      {icon === 'trash' && <Trash2Icon />}
      {icon === 'chart' && <BarChart3Icon />}
      {icon === 'refresh' && <RefreshCwIcon />}
      {icon === 'globe' && <GlobeIcon />}
    </div>
  )
}
