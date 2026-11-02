import type { ExecutionLogItem } from '@/api/get-executions'
import { CronJobIconBadge } from '@/components/cron-job-icon'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/primitives'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatDuration, formatRelativeTime, formatShortDateTime } from '@/lib/format'
import { EyeIcon } from 'lucide-react'

export interface ExecutionTableRowProps {
  execution: ExecutionLogItem
  onInspect: (execution: ExecutionLogItem) => void
}

export function ExecutionTableRow({ execution, onInspect }: ExecutionTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <CronJobIconBadge icon={execution.cronJobIcon ?? 'globe'} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {execution.cronJobName ?? 'Tarefa HTTP'}
            </span>
            <span className="max-w-xs truncate font-mono text-xs text-muted-foreground">
              {execution.requestMethod} {execution.requestUrl}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline">
          {execution.triggerType === 'manual' ? 'Manual' : 'Agendado'}
        </Badge>
      </TableCell>

      <TableCell>
        <StatusBadge status={execution.status} />
      </TableCell>

      <TableCell>
        <code className="font-mono text-xs font-semibold text-foreground">
          {execution.httpStatusCode ?? 'ERR'}
        </code>
      </TableCell>

      <TableCell>
        <span className="font-mono text-xs text-foreground">
          {formatDuration(execution.durationMs)}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {formatRelativeTime(execution.startedAt)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatShortDateTime(execution.startedAt)}
          </span>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onInspect(execution)}>
          <EyeIcon data-icon="inline-start" />
          Resposta
        </Button>
      </TableCell>
    </TableRow>
  )
}
