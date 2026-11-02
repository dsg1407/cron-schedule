import { type CronJobItem, type CronJobStatus, getCronJobs } from '@/api/get-cron-jobs'
import { getDashboardSummary } from '@/api/get-dashboard-summary'
import type { ExecutionLogItem } from '@/api/get-executions'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { CronJobFormDialog } from '../cron-jobs/cron-job-form-dialog'
import { ExecutionDetailsSheet } from '../executions/execution-details-sheet'
import { DashboardJobsCard } from './dashboard-jobs-card'
import { DashboardKpiCards } from './dashboard-kpi-cards'
import { DashboardKpiSkeleton } from './dashboard-kpi-skeleton'
import { RecentActivityCard } from './recent-activity-card'

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CronJobStatus | 'all'>('all')
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<CronJobItem | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionLogItem | null>(null)

  const { data: dashboardData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary(),
  })

  const { data: cronJobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['cron-jobs', searchQuery, statusFilter],
    queryFn: () =>
      getCronJobs({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        pageIndex: 0,
        perPage: 10,
      }),
  })

  function handleOpenCreateDialog() {
    setEditingJob(null)
    setIsJobDialogOpen(true)
  }

  function handleOpenEditDialog(job: CronJobItem) {
    setEditingJob(job)
    setIsJobDialogOpen(true)
  }

  function handleCycleStatusFilter() {
    setStatusFilter((previous) => {
      if (previous === 'all') return 'active'
      if (previous === 'active') return 'paused'
      return 'all'
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitore e gerencie suas tarefas agendadas com facilidade.
          </p>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <PlusIcon data-icon="inline-start" />
          Novo CronJob
        </Button>
      </div>

      {/* KPI Cards */}
      {isLoadingSummary || !dashboardData ? (
        <DashboardKpiSkeleton />
      ) : (
        <DashboardKpiCards summary={dashboardData.summary} />
      )}

      {/* Main Two-Column Grid: CronJobs Table (Left) + Recent Activity (Right) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <DashboardJobsCard
          cronJobs={cronJobsData?.cronJobs ?? []}
          isLoading={isLoadingJobs}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onToggleStatusFilter={handleCycleStatusFilter}
          onEditJob={handleOpenEditDialog}
          onCreateJob={handleOpenCreateDialog}
        />

        <RecentActivityCard
          activities={dashboardData?.summary.recentActivity ?? []}
          isLoading={isLoadingSummary}
          onSelectExecution={(execution) => setSelectedExecution(execution)}
        />
      </div>

      <CronJobFormDialog
        open={isJobDialogOpen}
        onOpenChange={setIsJobDialogOpen}
        editingJob={editingJob}
      />

      <ExecutionDetailsSheet
        execution={selectedExecution}
        open={Boolean(selectedExecution)}
        onOpenChange={(open) => {
          if (!open) setSelectedExecution(null)
        }}
      />
    </div>
  )
}
