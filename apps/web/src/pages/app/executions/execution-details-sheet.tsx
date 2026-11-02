import type { ExecutionLogItem } from '@/api/get-executions'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/primitives'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDuration, formatShortDateTime } from '@/lib/format'

export interface ExecutionDetailsSheetProps {
  execution: ExecutionLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPrettyBody(rawBody: string | null): string {
  if (!rawBody || rawBody.trim().length === 0) {
    return '// Sem corpo na resposta recebida'
  }
  try {
    const parsed = JSON.parse(rawBody)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return rawBody
  }
}

export function ExecutionDetailsSheet({
  execution,
  open,
  onOpenChange,
}: ExecutionDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <SheetTitle>{execution?.cronJobName ?? 'Inspeção de Execução'}</SheetTitle>
            {execution && <StatusBadge status={execution.status} />}
          </div>
          <SheetDescription>
            Telemetria completa da chamada HTTP, cabeçalhos e resposta recebida pelo servidor.
          </SheetDescription>
        </SheetHeader>

        {execution && (
          <div className="flex flex-col gap-5">
            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Status HTTP</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {execution.httpStatusCode ?? 'TIMEOUT / ERR'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Duração</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatDuration(execution.durationMs)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Gatilho</span>
                <span className="text-xs font-semibold text-foreground">
                  {execution.triggerType === 'manual' ? 'Manual' : 'Agendado (Cron)'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Tentativas</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {execution.attemptCount}x
                </span>
              </div>
            </div>

            {/* Target Endpoint */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3.5">
              <span className="text-xs font-medium text-muted-foreground">Endpoint chamado</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                <Badge variant="info" className="font-mono">
                  {execution.requestMethod}
                </Badge>
                <code className="font-mono text-xs text-foreground">{execution.requestUrl}</code>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Iniciado em {formatShortDateTime(execution.startedAt)}
              </span>
            </div>

            {/* Error Banner if Failed */}
            {execution.errorMessage && (
              <div className="flex flex-col gap-1 rounded-xl border border-destructive/40 bg-status-danger-bg p-3.5 text-status-danger-text">
                <span className="text-xs font-semibold">Diagnóstico de falha</span>
                <p className="font-mono text-xs">{execution.errorMessage}</p>
              </div>
            )}

            {/* Tabs for Response Body, Response Headers, Request Config */}
            <Tabs defaultValue="response-body">
              <TabsList>
                <TabsTrigger value="response-body"> Corpo da Resposta </TabsTrigger>
                <TabsTrigger value="response-headers">
                  Headers da Resposta ({Object.keys(execution.responseHeaders).length})
                </TabsTrigger>
                <TabsTrigger value="request-payload">Dados Enviados</TabsTrigger>
              </TabsList>

              <TabsContent value="response-body">
                <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
                  {formatPrettyBody(execution.responseBody)}
                </pre>
              </TabsContent>

              <TabsContent value="response-headers">
                <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
                  {Object.keys(execution.responseHeaders).length > 0
                    ? JSON.stringify(execution.responseHeaders, null, 2)
                    : '// Nenhum header retornado'}
                </pre>
              </TabsContent>

              <TabsContent value="request-payload">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Headers enviados
                    </span>
                    <pre className="max-h-44 overflow-auto rounded-xl border border-border bg-background p-3.5 font-mono text-xs text-foreground">
                      {Object.keys(execution.requestHeaders).length > 0
                        ? JSON.stringify(execution.requestHeaders, null, 2)
                        : '// Sem headers customizados'}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Body enviado</span>
                    <pre className="max-h-44 overflow-auto rounded-xl border border-border bg-background p-3.5 font-mono text-xs text-foreground">
                      {formatPrettyBody(execution.requestBody)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
