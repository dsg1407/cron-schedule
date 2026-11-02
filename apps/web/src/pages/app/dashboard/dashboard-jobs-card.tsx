import { deleteCronJob } from '@/api/delete-cron-job'
import type { CronJobItem, CronJobStatus, GetCronJobsResponse } from '@/api/get-cron-jobs'
import type { GetDashboardSummaryResponse } from '@/api/get-dashboard-summary'
import { toggleCronJobStatus } from '@/api/toggle-cron-job-status'
import { triggerCronJob } from '@/api/trigger-cron-job'
import { CronJobIconBadge } from '@/components/cron-job-icon'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input'
import { Empty } from '@/components/ui/primitives'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRelativeTime, formatShortDateTime } from '@/lib/format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MoreVerticalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardJobsSkeleton } from './dashboard-jobs-skeleton'

export interface DashboardJobsCardProps {
  cronJobs: CronJobItem[]
  isLoading: boolean
  searchQuery: string
  statusFilter: CronJobStatus | 'all'
  onSearchChange: (value: string) => void
  onToggleStatusFilter: () => void
  onEditJob: (job: CronJobItem) => void
  onCreateJob: () => void
  onInspectExecutionId?: (executionId: string) => void
}

export function DashboardJobsCard({
  cronJobs,
  isLoading,
  searchQuery,
  statusFilter,
  onSearchChange,
  onToggleStatusFilter,
  onEditJob,
  onCreateJob,
}: DashboardJobsCardProps) {
  const queryClient = useQueryClient()

  function updateCronJobOnCache(updatedJob: CronJobItem) {
    const cachedLists = queryClient.getQueriesData<GetCronJobsResponse>({
      queryKey: ['cron-jobs'],
    })

    for (const [cacheKey, cachedList] of cachedLists) {
      if (!cachedList) continue
      queryClient.setQueryData<GetCronJobsResponse>(cacheKey, {
        ...cachedList,
        cronJobs: cachedList.cronJobs.map((item) =>
          item.id === updatedJob.id ? updatedJob : item,
        ),
      })
    }
  }

  function removeCronJobFromCache(cronJobId: string) {
    const cachedLists = queryClient.getQueriesData<GetCronJobsResponse>({
      queryKey: ['cron-jobs'],
    })

    for (const [cacheKey, cachedList] of cachedLists) {
      if (!cachedList) continue
      queryClient.setQueryData<GetCronJobsResponse>(cacheKey, {
        ...cachedList,
        cronJobs: cachedList.cronJobs.filter((item) => item.id !== cronJobId),
        meta: {
          ...cachedList.meta,
          totalCount: Math.max(0, cachedList.meta.totalCount - 1),
        },
      })
    }
  }

  const { mutateAsync: toggleStatusFn } = useMutation({
    mutationFn: toggleCronJobStatus,
    onSuccess(data) {
      updateCronJobOnCache(data.cronJob)
    },
  })

  const { mutateAsync: triggerJobFn } = useMutation({
    mutationFn: triggerCronJob,
    onSuccess(data) {
      updateCronJobOnCache(data.cronJob)
      queryClient.setQueryData<GetDashboardSummaryResponse>(['dashboard-summary'], (previous) => {
        if (!previous) return previous
        return {
          summary: {
            ...previous.summary,
            executionsLast24h: previous.summary.executionsLast24h + 1,
            recentActivity: [data.execution, ...previous.summary.recentActivity.slice(0, 7)],
          },
        }
      })
    },
  })

  const { mutateAsync: deleteJobFn } = useMutation({
    mutationFn: deleteCronJob,
    onSuccess(_unused, { cronJobId }) {
      removeCronJobFromCache(cronJobId)
    },
  })

  async function handleTriggerNow(job: CronJobItem) {
    try {
      const result = await triggerJobFn({ cronJobId: job.id })
      if (result.execution.status === 'success') {
        toast.success(
          `"${job.name}" executado com sucesso (HTTP ${result.execution.httpStatusCode}).`,
        )
      } else {
        toast.error(`"${job.name}" falhou: ${result.execution.errorMessage ?? 'Erro HTTP'}`)
      }
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Erro ao disparar execução.')
    }
  }

  async function handleToggleJobStatus(job: CronJobItem) {
    try {
      const response = await toggleStatusFn({ cronJobId: job.id })
      toast.success(
        response.cronJob.status === 'active' ? `"${job.name}" retomado.` : `"${job.name}" pausado.`,
      )
    } catch {
      toast.error('Não foi possível alterar o status do CronJob.')
    }
  }

  async function handleDeleteJob(job: CronJobItem) {
    try {
      await deleteJobFn({ cronJobId: job.id })
      toast.success(`"${job.name}" removido.`)
    } catch {
      toast.error('Não foi possível excluir o CronJob.')
    }
  }

  return (
    <Card className="p-0 overflow-hidden gap-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">CronJobs</h2>

        <div className="flex items-center gap-2">
          <InputGroup className="w-56 sm:w-64">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Buscar cronjobs..."
              aria-label="Buscar cronjobs"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </InputGroup>

          <Button
            variant={statusFilter === 'all' ? 'outline' : 'secondary'}
            size="sm"
            onClick={onToggleStatusFilter}
            aria-label="Filtrar por status"
          >
            <SlidersHorizontalIcon data-icon="inline-start" />
            {statusFilter === 'all' ? 'Todos' : statusFilter === 'active' ? 'Ativos' : 'Pausados'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DashboardJobsSkeleton />
      ) : cronJobs.length === 0 ? (
        <div className="p-6">
          <Empty>
            <p className="text-sm font-medium text-foreground">Nenhum CronJob encontrado</p>
            <p className="text-xs text-muted-foreground">
              Cadastre uma URL de serviço e uma expressão cron para iniciar o monitoramento.
            </p>
            <Button size="sm" onClick={onCreateJob} className="mt-2">
              <PlusIcon data-icon="inline-start" />
              Novo CronJob
            </Button>
          </Empty>
        </div>
      ) : (
        <Table regionLabel="Lista de CronJobs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead>Última Execução</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cronJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CronJobIconBadge icon={job.icon} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{job.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {job.description ?? job.url}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <code className="font-mono text-xs font-medium text-foreground">
                    {job.cronExpression}
                  </code>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">
                      {formatRelativeTime(job.lastRunAt)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatShortDateTime(job.lastRunAt)}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label={`Ações para ${job.name}`} className="size-8">
                      <MoreVerticalIcon aria-hidden="true" className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => handleTriggerNow(job)}>
                          <PlayIcon aria-hidden="true" />
                          <span>Executar agora</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleJobStatus(job)}>
                          <PauseIcon aria-hidden="true" />
                          <span>
                            {job.status === 'active' ? 'Pausar agendamento' : 'Retomar agendamento'}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditJob(job)}>
                          <PencilIcon aria-hidden="true" />
                          <span>Editar configurações</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => handleDeleteJob(job)}
                          className="text-destructive data-[highlighted]:bg-status-danger-bg"
                        >
                          <Trash2Icon aria-hidden="true" />
                          <span>Excluir CronJob</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
