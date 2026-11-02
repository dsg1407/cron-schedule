import type { DashboardSummary } from '@/api/get-dashboard-summary'
import { Sparkline } from '@/components/sparkline'
import { Card } from '@/components/ui/card'
import { formatDuration, formatPercentage } from '@/lib/format'
import { CalendarIcon, CheckCircle2Icon, ClockIcon, PlayIcon } from 'lucide-react'

export interface DashboardKpiCardsProps {
  summary: DashboardSummary
}

export function DashboardKpiCards({ summary }: DashboardKpiCardsProps) {
  const executionsSeries = summary.hourlySeries.map((point) => point.executionsCount)
  const successSeries = summary.hourlySeries.map((point) => point.successRatePercent)
  const durationSeries = summary.hourlySeries.map((point) => point.averageDurationMs)
  const jobsSeries = [
    Math.max(1, summary.totalCronJobs - 2),
    Math.max(1, summary.totalCronJobs - 1),
    summary.totalCronJobs,
    summary.totalCronJobs,
    summary.totalCronJobs,
  ]

  return (
    <section
      aria-label="Métricas principais"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* Card 1: Total CronJobs */}
      <Card className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-info-bg text-status-info-text">
            <CalendarIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col">
            <span
              data-testid="kpi-total-jobs"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {summary.totalCronJobs}
            </span>
            <span className="text-xs text-muted-foreground">Total de CronJobs</span>
          </div>
        </div>
        <Sparkline values={jobsSeries} tone="info" />
      </Card>

      {/* Card 2: Executions (24h) */}
      <Card className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success-text">
            <PlayIcon aria-hidden="true" className="size-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span
              data-testid="kpi-executions-24h"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {summary.executionsLast24h}
            </span>
            <span className="text-xs text-muted-foreground">Execuções (24h)</span>
          </div>
        </div>
        <Sparkline values={executionsSeries} tone="success" />
      </Card>

      {/* Card 3: Success Rate */}
      <Card className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success-text">
            <CheckCircle2Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col">
            <span
              data-testid="kpi-success-rate"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {formatPercentage(summary.successRatePercent)}
            </span>
            <span className="text-xs text-muted-foreground">Taxa de Sucesso</span>
          </div>
        </div>
        <Sparkline values={successSeries} tone="success" />
      </Card>

      {/* Card 4: Avg Duration */}
      <Card className="flex flex-row items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-purple-bg text-status-purple-text">
            <ClockIcon aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col">
            <span
              data-testid="kpi-avg-duration"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {formatDuration(summary.averageDurationMs)}
            </span>
            <span className="text-xs text-muted-foreground">Duração Média</span>
          </div>
        </div>
        <Sparkline values={durationSeries} tone="purple" />
      </Card>
    </section>
  )
}
