import type { ExecutionOutcome } from '@/api/get-cron-jobs'
import { type ExecutionLogItem, getExecutions } from '@/api/get-executions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input'
import { Empty } from '@/components/ui/primitives'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ExecutionDetailsSheet } from './execution-details-sheet'
import { ExecutionTableRow } from './execution-table-row'
import { ExecutionTableSkeleton } from './execution-table-skeleton'

export function Executions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''
  const rawStatus = searchParams.get('status')
  const statusFilter: ExecutionOutcome | 'all' =
    rawStatus === 'success' || rawStatus === 'failed' ? rawStatus : 'all'

  const [selectedExecution, setSelectedExecution] = useState<ExecutionLogItem | null>(null)

  const { data: executionsData, isLoading } = useQuery({
    queryKey: ['executions', searchQuery, statusFilter],
    queryFn: () =>
      getExecutions({
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

  function handleStatusFilterChange(nextStatus: ExecutionOutcome | 'all') {
    setSearchParams((previous) => {
      if (nextStatus === 'all') previous.delete('status')
      else previous.set('status', nextStatus)
      return previous
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Histórico de Execuções & Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Inspecione status HTTP, duração, cabeçalhos e corpos de resposta de cada execução.
        </p>
      </div>

      <Card className="p-0 overflow-hidden gap-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('all')}
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === 'success' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('success')}
            >
              Sucesso
            </Button>
            <Button
              variant={statusFilter === 'failed' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('failed')}
            >
              Falhas
            </Button>
          </div>

          <InputGroup className="w-64">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Filtrar por job ou URL..."
              aria-label="Filtrar execuções"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </InputGroup>
        </div>

        {isLoading ? (
          <ExecutionTableSkeleton />
        ) : !executionsData || executionsData.executions.length === 0 ? (
          <div className="p-6">
            <Empty>
              <p className="text-sm font-medium text-foreground">Nenhuma execução encontrada</p>
              <p className="text-xs text-muted-foreground">
                Dispare um CronJob manualmente ou aguarde o próximo ciclo agendado.
              </p>
            </Empty>
          </div>
        ) : (
          <Table regionLabel="Histórico de execuções">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>CronJob & Endpoint</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead className="text-right">Inspeção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executionsData.executions.map((executionItem) => (
                <ExecutionTableRow
                  key={executionItem.id}
                  execution={executionItem}
                  onInspect={(execution) => setSelectedExecution(execution)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
