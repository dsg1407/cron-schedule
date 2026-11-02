import type { ExecutionLogItem } from '@/api/get-executions'
import { Card } from '@/components/ui/card'
import { Empty } from '@/components/ui/primitives'
import { formatDuration, formatRelativeTime } from '@/lib/format'
import { ArrowRightIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Link } from 'react-router'
import { RecentActivitySkeleton } from './recent-activity-skeleton'

export interface RecentActivityCardProps {
  activities: ExecutionLogItem[]
  isLoading: boolean
  onSelectExecution: (execution: ExecutionLogItem) => void
}

export function RecentActivityCard({
  activities,
  isLoading,
  onSelectExecution,
}: RecentActivityCardProps) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Atividade Recente</h2>
        <Link
          to="/executions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>Ver todas</span>
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <RecentActivitySkeleton />
      ) : activities.length === 0 ? (
        <Empty className="p-6">
          <p className="text-xs font-medium text-foreground">Nenhuma execução registrada</p>
          <p className="text-[11px] text-muted-foreground">
            As respostas e tempos de execução aparecerão aqui assim que um job rodar.
          </p>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((activity) => {
            const isSuccess = activity.status === 'success'
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onSelectExecution(activity)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSuccess ? (
                  <CheckCircle2Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-status-success-dot"
                  />
                ) : (
                  <XCircleIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-status-danger-dot"
                  />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {activity.cronJobName ?? 'CronJob'} {isSuccess ? 'concluído' : 'falhou'}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatRelativeTime(activity.startedAt)} • {formatDuration(activity.durationMs)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
