import { DonationDialog } from '@/components/donation-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { env } from '@/env'
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileCode2Icon,
  HeartIcon,
  PlayIcon,
  QrCodeIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  TerminalIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

interface PipelineStep {
  stepNumber: string
  title: string
  description: string
  technicalFact: string
  icon: typeof ClockIcon
}

const EXECUTION_PIPELINE_STEPS: PipelineStep[] = [
  {
    stepNumber: '01',
    title: 'Disparo no fuso IANA com trava de sobreposição',
    description:
      'O agendador Croner avalia a expressão de 5 campos no fuso horário configurado no job, respeitando horário local e viradas de calendário.',
    technicalFact:
      'Com protect: true ativo, se a chamada anterior ainda estiver aguardando resposta quando chegar o próximo ciclo, o disparo sobreposto é ignorado até a conexão ativa terminar.',
    icon: ClockIcon,
  },
  {
    stepNumber: '02',
    title: 'Injeção de cabeçalhos de rastreabilidade',
    description:
      'Seus cabeçalhos de autenticação (Authorization, x-api-key) são mesclados com metadados fixos de identificação do agendador antes de abrir o socket.',
    technicalFact:
      'Toda requisição inclui User-Agent: CronFlow-Scheduler/1.0 e X-CronFlow-Job-Id contendo o UUIDv7 único da tarefa agendada.',
    icon: TerminalIcon,
  },
  {
    stepNumber: '03',
    title: 'Validação de status 2xx e backoff exponencial',
    description:
      'Qualquer resposta HTTP entre 200 e 299 encerra a execução como Sucesso na primeira tentativa.',
    technicalFact:
      'Respostas 4xx, 5xx, falhas de DNS ou estouro de timeout acionam até 5 retentativas com atrasos fixos de 500ms, 1s, 2s, 4s e 8s.',
    icon: RefreshCwIcon,
  },
  {
    stepNumber: '04',
    title: 'Gravação de telemetria e payload (SQLite / PostgreSQL)',
    description:
      'Ao final da execução, o histórico persiste código HTTP, latência em milissegundos, total de tentativas realizadas e cabeçalhos recebidos (SQLite em dev/test e PostgreSQL em produção).',
    technicalFact:
      'O corpo da resposta é gravado até 64 KB (65.536 bytes). Payloads maiores recebem o marcador "... [truncated at 64KB]" para manter a inspeção rápida.',
    icon: FileCode2Icon,
  },
]

interface CronPresetExample {
  expression: string
  label: string
  useCase: string
  nextTickHint: string
}

const CRON_PRESET_EXAMPLES: CronPresetExample[] = [
  {
    expression: '*/5 * * * *',
    label: 'A cada 5 minutos',
    useCase: 'Sincronização de fila de pedidos, healthcheck externo ou atualização de cache.',
    nextTickHint: 'Minutos 00, 05, 10, 15... de todas as horas',
  },
  {
    expression: '0 * * * *',
    label: 'No minuto zero de cada hora',
    useCase: 'Consolidação horária de métricas financeiras e importação de notas fiscais.',
    nextTickHint: '00:00, 01:00, 02:00... (24 disparos por dia)',
  },
  {
    expression: '0 2 * * *',
    label: 'Todos os dias às 02:00',
    useCase: 'Rotina de dump de banco de dados, expurgo de arquivos temporários e reindexação.',
    nextTickHint: '02:00 no fuso horário configurado no job',
  },
  {
    expression: '30 8 * * 1-5',
    label: 'Segunda a sexta às 08:30',
    useCase: 'Envio de resumo comercial matinal e alertas de faturas que vencem no dia útil.',
    nextTickHint: 'Dias úteis (1 = segunda, 5 = sexta)',
  },
  {
    expression: '0 9 * * 1',
    label: 'Toda segunda-feira às 09:00',
    useCase: 'Relatório semanal de performance e fechamento de indicadores da semana anterior.',
    nextTickHint: 'Segundas-feiras às 09:00',
  },
  {
    expression: '0 0 1 * *',
    label: 'Dia 1 de cada mês à meia-noite',
    useCase: 'Faturamento recorrente mensal, fechamento contábil e renovação de cotas.',
    nextTickHint: '00:00 do primeiro dia de cada mês',
  },
]

interface FaqItem {
  id: string
  question: string
  answer: string
  codeHint?: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-overlap',
    question: 'O que acontece se meu endpoint demorar mais que o intervalo do agendamento?',
    answer:
      'O CronFlow registra cada job no Croner com a opção protect: true. Enquanto uma chamada estiver em andamento (incluindo o tempo gasto em retentativas de backoff), qualquer novo disparo agendado para aquele mesmo CronJob é bloqueado. Isso evita empilhamento de conexões em serviços que já estão lentos.',
  },
  {
    id: 'faq-status-codes',
    question: 'Quais códigos HTTP contam como sucesso e quais acionam retentativa?',
    answer:
      'Apenas códigos no intervalo 200 a 299 (como 200 OK, 201 Created, 202 Accepted e 204 No Content) são marcados como Sucesso. Redirecionamentos não resolvidos, erros 4xx (como 401, 404, 422, 429), erros 5xx (500, 502, 503, 504) e timeouts de socket acionam a política de retentativas configurada na tarefa.',
  },
  {
    id: 'faq-idempotency',
    question: 'Como evitar processamento duplicado quando uma retentativa é disparada?',
    answer:
      'Se a sua API processar a tarefa mas a conexão cair antes de devolver o HTTP 200, o CronFlow fará uma nova tentativa segundos depois. Use o cabeçalho X-CronFlow-Job-Id aliado à janela de horário ou a uma chave de lock na sua aplicação para garantir idempotência.',
    codeHint: 'const jobId = request.headers["x-cronflow-job-id"]',
  },
  {
    id: 'faq-private-networks',
    question: 'Como testar webhooks rodando em localhost ou na rede local?',
    answer:
      'Em ambiente de desenvolvimento (NODE_ENV=development), chamadas para localhost, 127.0.0.1 e faixas privadas são permitidas por padrão. Em produção, o executor bloqueia IPs privados e loopback para evitar ataques de SSRF, a menos que a variável de ambiente ALLOW_PRIVATE_NETWORKS=true seja definida explicitamente no servidor da API.',
    codeHint: 'ALLOW_PRIVATE_NETWORKS=true pnpm --filter @cronflow/api start',
  },
  {
    id: 'faq-retention',
    question: 'Como limpar logs antigos para manter o banco de dados enxuto?',
    answer:
      'Acesse a página Configurações no menu lateral, defina o período de retenção desejado (entre 1 e 365 dias, padrão de 30 dias) e clique em Executar limpeza agora. O comando remove imediatamente do SQLite (dev/test) ou PostgreSQL (produção) os registros de execução anteriores à data de corte e preserva todos os seus CronJobs cadastrados.',
  },
]

const SAMPLE_HTTP_REQUEST = `POST /webhooks/fechamento-diario HTTP/1.1
Host: api.suaempresa.com.br
User-Agent: CronFlow-Scheduler/1.0
X-CronFlow-Job-Id: 0195f3a2-7c90-7b12-9a44-82c10e51902b
Content-Type: application/json
Authorization: Bearer sk_live_9f8a7b6c5d4e

{
  "origin": "cronflow",
  "scope": "daily-settlement",
  "dryRun": false
}`

export function Docs() {
  const navigate = useNavigate()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false)

  const swaggerDocsUrl = `${env.VITE_API_URL.replace(/\/$/, '')}/docs`
  const pixKey = env.VITE_DONATION_PIX_KEY
  const sponsorUrl = env.VITE_DONATION_SPONSOR_URL

  async function handleCopyText(text: string, key: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success(`${label} copiado para a área de transferência.`)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current))
      }, 2000)
    } catch {
      toast.error('Não foi possível copiar automaticamente.')
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Above the Fold / Hero */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-5 lg:max-w-3xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            <BookOpenIcon aria-hidden="true" className="size-3.5" />
            <span>DOCUMENTAÇÃO TÉCNICA & REFERÊNCIA HTTP</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Agende chamadas HTTP com retentativas automáticas e resposta gravada até o último
              byte.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              O CronFlow dispara requisições GET, POST, PUT, PATCH ou DELETE no fuso horário do seu
              serviço, aplica backoff exponencial quando o endpoint falha e armazena status HTTP,
              latência em milissegundos, cabeçalhos e corpo de resposta de cada execução.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={() => navigate('/cron-jobs')}>
              <PlayIcon aria-hidden="true" />
              <span>Criar CronJob agora</span>
            </Button>

            <Button variant="outline" onClick={() => navigate('/executions')}>
              <span>Inspecionar histórico de execuções</span>
              <ArrowRightIcon aria-hidden="true" />
            </Button>

            <a
              href={swaggerDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>Especificação OpenAPI (Swagger)</span>
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 1: 4-Step Execution Pipeline */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Do segundo agendado até a gravação do payload
          </h2>
          <p className="text-sm text-muted-foreground">
            Um script solto no crontab do servidor falha em silêncio quando o certificado expira ou
            o serviço retorna erro 502. Veja o que acontece em cada disparo gerenciado pelo
            CronFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {EXECUTION_PIPELINE_STEPS.map((step) => {
            const StepIcon = step.icon
            return (
              <Card key={step.stepNumber} className="justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <StepIcon aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      ETAPA {step.stepNumber}
                    </span>
                  </div>
                  <CardTitle className="pt-2 text-base">{step.title}</CardTitle>
                  <CardDescription className=" leading-relaxed">{step.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-xs leading-relaxed text-foreground-subtle">
                    {step.technicalFact}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Section 2: HTTP Contract & Operational Limits (Lopsided Density) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: HTTP Request Anatomy (7 columns) */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <CardTitle>Como sua API identifica uma chamada do CronFlow</CardTitle>
                <CardDescription>
                  Use os cabeçalhos injetados automaticamente para auditar a origem do disparo e
                  garantir idempotência no seu backend.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyText(SAMPLE_HTTP_REQUEST, 'http-sample', 'Exemplo de requisição HTTP')
                }
              >
                {copiedKey === 'http-sample' ? (
                  <>
                    <CheckIcon aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <CopyIcon aria-hidden="true" />
                    <span>Copiar requisição</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>{SAMPLE_HTTP_REQUEST}</code>
            </pre>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/40 p-3.5">
                <p className="font-mono text-xs font-semibold text-foreground">X-CronFlow-Job-Id</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  UUIDv7 fixo do CronJob que originou o disparo. Grave esse identificador nos logs
                  da sua aplicação para cruzar rapidamente com a tela de Execuções.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3.5">
                <p className="font-mono text-xs font-semibold text-foreground">
                  Content-Type: application/json
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Adicionado automaticamente quando você preenche um payload nos métodos POST, PUT
                  ou PATCH e não define um Content-Type próprio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Operational Limits & Honest Boundaries (5 columns) */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlertIcon aria-hidden="true" className="size-4 text-primary" />
              <CardTitle>Limites reais de operação</CardTitle>
            </div>
            <CardDescription>
              Parâmetros exatos do executor HTTP para você dimensionar seus endpoints sem surpresas
              em produção.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3.5 text-xs">
            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Timeout por tentativa</span>
                <span className="font-mono text-primary">1.000 ms a 120.000 ms</span>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                O padrão é 30.000 ms (30s). Se sua rotina leva mais de 2 minutos para concluir,
                retorne <code className="font-mono text-foreground">HTTP 202 Accepted</code>{' '}
                imediatamente e processe o lote em fila assíncrona.
              </p>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Política de retentativas</span>
                <span className="font-mono text-primary">0 a 5 retentativas</span>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Fórmula <code className="font-mono text-foreground">500ms * 2^(tentativa - 1)</code>
                . Com 5 retentativas, o job executa até 6 chamadas antes de registrar status Falhou.
              </p>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Captura de corpo de resposta</span>
                <span className="font-mono text-primary">Máximo de 64 KB</span>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Os primeiros 65.536 bytes UTF-8 são salvos no banco para inspeção no painel lateral.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Proteção contra SSRF</span>
                <span className="font-mono text-primary">ALLOW_PRIVATE_NETWORKS</span>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Em produção, IPs privados (<code className="font-mono text-foreground">10.x</code>,{' '}
                <code className="font-mono text-foreground">172.16-31.x</code>,{' '}
                <code className="font-mono text-foreground">192.168.x</code>) e loopback são
                recusados antes da conexão.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: 5-Field Cron Syntax Reference & Click-to-Copy Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Sintaxe Cron de 5 campos pronta para copiar</CardTitle>
          <CardDescription>
            O CronFlow utiliza o formato POSIX de cinco campos separados por espaço. Clique em
            qualquer expressão da tabela para copiar e colar no cadastro do seu CronJob.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* 5-Field Visual Breakdown */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              { field: '1. Minuto', range: '0 - 59', example: '*/5 ou 0' },
              { field: '2. Hora', range: '0 - 23', example: '2 ou 8-18' },
              { field: '3. Dia do mês', range: '1 - 31', example: '1 ou 15' },
              { field: '4. Mês', range: '1 - 12', example: '* ou 1-6' },
              { field: '5. Dia da semana', range: '0 - 6 (Dom-Sáb)', example: '1-5 (Seg-Sex)' },
            ].map((item) => (
              <div
                key={item.field}
                className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3"
              >
                <span className="text-xs font-semibold text-foreground">{item.field}</span>
                <span className="font-mono text-xs font-bold text-primary">{item.range}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Ex.: {item.example}
                </span>
              </div>
            ))}
          </div>

          <Table regionLabel="Exemplos de expressões Cron de 5 campos">
            <TableHeader>
              <TableRow>
                <TableHead>Expressão</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Caso de uso comum</TableHead>
                <TableHead>Quando dispara</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CRON_PRESET_EXAMPLES.map((preset) => {
                const isCopied = copiedKey === preset.expression
                return (
                  <TableRow key={preset.expression}>
                    <TableCell>
                      <code className="rounded bg-secondary px-2 py-1 font-mono text-xs font-semibold text-foreground">
                        {preset.expression}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{preset.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {preset.useCase}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {preset.nextTickHint}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyText(
                            preset.expression,
                            preset.expression,
                            `Expressão "${preset.expression}"`,
                          )
                        }
                      >
                        {isCopied ? (
                          <>
                            <CheckIcon aria-hidden="true" />
                            <span>Copiada</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon aria-hidden="true" />
                            <span>Copiar</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 4: Exclusive Accordion FAQ using native <details name="docs-faq"> */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Respostas diretas para dúvidas de operação
          </h2>
          <p className="text-sm text-muted-foreground">
            Todo o conteúdo abaixo permanece indexado para busca rápida na página (Cmd+F ou Ctrl+F),
            mesmo nos itens recolhidos.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQ_ITEMS.map((faqItem, index) => (
            <details
              key={faqItem.id}
              id={faqItem.id}
              name="docs-faq"
              open={index === 0}
              className="group rounded-xl border border-border bg-surface transition-colors open:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-foreground select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                <span>{faqItem.question}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45 group-open:bg-primary/15 group-open:text-primary"
                >
                  +
                </span>
              </summary>
              <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                <p>{faqItem.answer}</p>
                {faqItem.codeHint ? (
                  <pre className="overflow-x-auto rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-xs text-foreground">
                    <code>{faqItem.codeHint}</code>
                  </pre>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">
            Pronto para substituir aquele script perdido no crontab do servidor?
          </h2>
          <p className="text-sm text-muted-foreground">
            Cadastre o endpoint da sua API em menos de um minuto, dispare um teste manual pelo
            painel e inspecione o payload retornado na hora.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <span>Ajustar timeout padrão</span>
          </Button>
          <Button onClick={() => navigate('/cron-jobs')}>
            <span>Cadastrar CronJob</span>
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* Open Source MIT & Donation Card */}
      <Card className="border-primary/25 bg-surface">
        <CardContent className="flex flex-col justify-between gap-5 pt-5 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-1.5 lg:max-w-2xl">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text">
              <HeartIcon aria-hidden="true" className="size-3.5 fill-current" />
              <span>Open Source • Licença MIT</span>
            </div>
            <h2 className="text-base font-bold text-foreground">
              Apoie a evolução do CronFlow (Donation)
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O CronFlow é código aberto sob licença MIT, criado e mantido por Daniel S. Gonçalves.
              Se o agendador ajuda a manter a operação da sua equipe em dia, contribua via PIX ou
              GitHub Sponsors.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => handleCopyText(pixKey, 'docs-pix-key', 'Chave PIX')}
            >
              {copiedKey === 'docs-pix-key' ? (
                <>
                  <CheckIcon aria-hidden="true" />
                  <span>PIX copiado ({pixKey})</span>
                </>
              ) : (
                <>
                  <CopyIcon aria-hidden="true" />
                  <span>Copiar PIX ({pixKey})</span>
                </>
              )}
            </Button>

            <Button variant="secondary" onClick={() => setIsDonationDialogOpen(true)}>
              <QrCodeIcon aria-hidden="true" />
              <span>QR Code PIX & BRCode</span>
            </Button>

            <a
              href={sponsorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
            >
              <HeartIcon aria-hidden="true" className="size-4 fill-current" />
              <span>GitHub Sponsors</span>
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <DonationDialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen} />
    </div>
  )
}
