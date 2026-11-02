import { type CronJobItem, type CronJobStatus, getCronJobs } from '@/api/get-cron-jobs'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { DashboardJobsCard } from '../dashboard/dashboard-jobs-card'
import { CronJobFormDialog } from './cron-job-form-dialog'

export function CronJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''
  const rawStatus = searchParams.get('status')
  const statusFilter: CronJobStatus | 'all' =
    rawStatus === 'active' || rawStatus === 'paused' ? rawStatus : 'all'

  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<CronJobItem | null>(null)

  const { data: cronJobsData, isLoading } = useQuery({
    queryKey: ['cron-jobs', searchQuery, statusFilter],
    queryFn: () =>
      getCronJobs({
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        pageIndex: 0,
        perPage: 50,
      }),
  })

  function handleSearchChange(value: string) {
    setSearchParams((previous) => {
      if (value) previous.set('search', value)
      else previous.delete('search')
      return previous
    })
  }

  function handleToggleStatusFilter() {
    setSearchParams((previous) => {
      const current = previous.get('status')
      if (!current) previous.set('status', 'active')
      else if (current === 'active') previous.set('status', 'paused')
      else previous.delete('status')
      return previous
    })
  }

  function handleCreateJob() {
    setEditingJob(null)
    setIsJobDialogOpen(true)
  }

  function handleEditJob(job: CronJobItem) {
    setEditingJob(job)
    setIsJobDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CronJobs</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre URLs de serviço, cabeçalhos HTTP e expressões de agendamento.
          </p>
        </div>

        <Button onClick={handleCreateJob}>
          <PlusIcon data-icon="inline-start" />
          Novo CronJob
        </Button>
      </div>

      <DashboardJobsCard
        cronJobs={cronJobsData?.cronJobs ?? []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onToggleStatusFilter={handleToggleStatusFilter}
        onEditJob={handleEditJob}
        onCreateJob={handleCreateJob}
      />

      <CronJobFormDialog
        open={isJobDialogOpen}
        onOpenChange={setIsJobDialogOpen}
        editingJob={editingJob}
      />
    </div>
  )
}
