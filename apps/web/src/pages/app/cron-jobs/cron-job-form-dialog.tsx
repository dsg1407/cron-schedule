import { createCronJob } from '@/api/create-cron-job'
import type { CronJobIcon, CronJobItem, GetCronJobsResponse, HttpMethod } from '@/api/get-cron-jobs'
import { updateCronJob } from '@/api/update-cron-job'
import { CronJobIconBadge } from '@/components/cron-job-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { Spinner } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const ICON_OPTIONS: { value: CronJobIcon; label: string }[] = [
  { value: 'database', label: 'Banco' },
  { value: 'mail', label: 'E-mail' },
  { value: 'trash', label: 'Limpeza' },
  { value: 'chart', label: 'Métricas' },
  { value: 'refresh', label: 'Sync' },
  { value: 'globe', label: 'Webhook' },
]

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const CRON_PRESETS = [
  { label: 'A cada 5 min', expression: '*/5 * * * *' },
  { label: 'A cada hora', expression: '0 * * * *' },
  { label: 'A cada 6h', expression: '0 */6 * * *' },
  { label: 'Diário às 02:00', expression: '0 2 * * *' },
  { label: 'Segundas às 09:00', expression: '0 9 * * 1' },
]

const cronJobFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome do CronJob.'),
  description: z.string().optional(),
  icon: z.enum(['database', 'mail', 'trash', 'chart', 'refresh', 'globe']),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url('Informe uma URL de serviço válida (http:// ou https://).'),
  cronExpression: z.string().min(5, 'Informe uma expressão cron válida (ex.: 0 2 * * *).'),
  timezone: z.string().min(1, 'Informe o fuso horário.'),
  timeoutMs: z.coerce.number().int().min(500).max(120000),
  maxRetries: z.coerce.number().int().min(0).max(5),
  headerEntries: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  body: z.string().optional(),
})

type CronJobFormSchema = z.infer<typeof cronJobFormSchema>

export interface CronJobFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingJob?: CronJobItem | null
}

function mapHeadersToEntries(headers: Record<string, string> | undefined) {
  if (!headers) return [{ key: '', value: '' }]
  const entries = Object.entries(headers).map(([headerKey, headerValue]) => ({
    key: headerKey,
    value: headerValue,
  }))
  return entries.length > 0 ? entries : [{ key: '', value: '' }]
}

export function CronJobFormDialog({ open, onOpenChange, editingJob }: CronJobFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(editingJob)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CronJobFormSchema>({
    resolver: zodResolver(cronJobFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'database',
      method: 'POST',
      url: '',
      cronExpression: '0 2 * * *',
      timezone: 'America/Sao_Paulo',
      timeoutMs: 30000,
      maxRetries: 1,
      headerEntries: [{ key: '', value: '' }],
      body: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'headerEntries',
  })

  useEffect(() => {
    if (editingJob) {
      reset({
        name: editingJob.name,
        description: editingJob.description ?? '',
        icon: editingJob.icon,
        method: editingJob.method,
        url: editingJob.url,
        cronExpression: editingJob.cronExpression,
        timezone: editingJob.timezone,
        timeoutMs: editingJob.timeoutMs,
        maxRetries: editingJob.maxRetries,
        headerEntries: mapHeadersToEntries(editingJob.headers),
        body: editingJob.body ?? '',
      })
    } else if (open) {
      reset({
        name: '',
        description: '',
        icon: 'database',
        method: 'POST',
        url: '',
        cronExpression: '0 2 * * *',
        timezone: 'America/Sao_Paulo',
        timeoutMs: 30000,
        maxRetries: 1,
        headerEntries: [{ key: '', value: '' }],
        body: '',
      })
    }
  }, [editingJob, open, reset])

  function upsertCronJobOnCache(savedJob: CronJobItem) {
    const cachedLists = queryClient.getQueriesData<GetCronJobsResponse>({
      queryKey: ['cron-jobs'],
    })

    for (const [cacheKey, cachedList] of cachedLists) {
      if (!cachedList) continue
      const exists = cachedList.cronJobs.some((item) => item.id === savedJob.id)
      const updatedItems = exists
        ? cachedList.cronJobs.map((item) => (item.id === savedJob.id ? savedJob : item))
        : [savedJob, ...cachedList.cronJobs]

      queryClient.setQueryData<GetCronJobsResponse>(cacheKey, {
        ...cachedList,
        cronJobs: updatedItems,
        meta: {
          ...cachedList.meta,
          totalCount: exists ? cachedList.meta.totalCount : cachedList.meta.totalCount + 1,
        },
      })
    }
  }

  const { mutateAsync: createCronJobFn, isPending: isCreating } = useMutation({
    mutationFn: createCronJob,
    onSuccess(data) {
      upsertCronJobOnCache(data.cronJob)
    },
  })

  const { mutateAsync: updateCronJobFn, isPending: isUpdating } = useMutation({
    mutationFn: updateCronJob,
    onSuccess(data) {
      upsertCronJobOnCache(data.cronJob)
    },
  })

  const isSaving = isCreating || isUpdating
  const selectedIcon = watch('icon')
  const selectedMethod = watch('method')
  const currentCronExpression = watch('cronExpression')

  async function handleSaveCronJob(values: CronJobFormSchema) {
    const headersRecord: Record<string, string> = {}
    for (const entry of values.headerEntries) {
      const trimmedKey = entry.key.trim()
      if (trimmedKey.length > 0) {
        headersRecord[trimmedKey] = entry.value.trim()
      }
    }

    try {
      if (editingJob) {
        await updateCronJobFn({
          cronJobId: editingJob.id,
          name: values.name,
          description: values.description || null,
          icon: values.icon,
          method: values.method,
          url: values.url,
          cronExpression: values.cronExpression,
          timezone: values.timezone,
          timeoutMs: values.timeoutMs,
          maxRetries: values.maxRetries,
          headers: headersRecord,
          body: values.body?.trim() ? values.body : null,
        })
        toast.success('CronJob atualizado com sucesso.')
      } else {
        await createCronJobFn({
          name: values.name,
          description: values.description || null,
          icon: values.icon,
          method: values.method,
          url: values.url,
          cronExpression: values.cronExpression,
          timezone: values.timezone,
          timeoutMs: values.timeoutMs,
          maxRetries: values.maxRetries,
          headers: headersRecord,
          body: values.body?.trim() ? values.body : null,
          status: 'active',
        })
        toast.success('CronJob cadastrado e agendado.')
      }

      onOpenChange(false)
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : 'Não foi possível salvar o CronJob.'
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar CronJob' : 'Novo CronJob'}</DialogTitle>
          <DialogDescription>
            Configure o endpoint HTTP, cabeçalhos de autenticação e a expressão cron de execução.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveCronJob)} className="flex flex-col gap-5">
          <FieldGroup>
            {/* Name & Description */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={errors.name ? '' : undefined}>
                <FieldLabel htmlFor="job-name">Nome da tarefa</FieldLabel>
                <Input
                  id="job-name"
                  placeholder="Ex.: Backup Database"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                {errors.name && <FieldDescription>{errors.name.message}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="job-description">Descrição curta</FieldLabel>
                <Input
                  id="job-description"
                  placeholder="Ex.: Daily database backup"
                  {...register('description')}
                />
              </Field>
            </div>

            {/* Category Icon Picker */}
            <Field>
              <FieldLabel>Ícone de identificação</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                {ICON_OPTIONS.map((option) => {
                  const isSelected = selectedIcon === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue('icon', option.value)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        isSelected
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-border bg-surface text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <CronJobIconBadge icon={option.value} size="sm" className="size-6" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* HTTP Method & Target URL */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
              <Field>
                <FieldLabel htmlFor="job-method">Método HTTP</FieldLabel>
                <select
                  id="job-method"
                  className="flex h-9 w-full rounded-lg border border-input bg-surface px-3 font-mono text-xs font-semibold text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  {...register('method')}
                >
                  {HTTP_METHODS.map((httpMethod) => (
                    <option key={httpMethod} value={httpMethod}>
                      {httpMethod}
                    </option>
                  ))}
                </select>
              </Field>

              <Field data-invalid={errors.url ? '' : undefined}>
                <FieldLabel htmlFor="job-url">URL do serviço</FieldLabel>
                <Input
                  id="job-url"
                  placeholder="https://api.seudominio.com/webhooks/sync"
                  className="font-mono text-xs"
                  aria-invalid={Boolean(errors.url)}
                  {...register('url')}
                />
                {errors.url && <FieldDescription>{errors.url.message}</FieldDescription>}
              </Field>
            </div>

            {/* Cron Schedule & Timezone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                data-invalid={errors.cronExpression ? '' : undefined}
                className="sm:col-span-2"
              >
                <FieldLabel htmlFor="job-cron">Expressão Cron (5 campos)</FieldLabel>
                <Input
                  id="job-cron"
                  placeholder="0 2 * * *"
                  className="font-mono text-xs"
                  aria-invalid={Boolean(errors.cronExpression)}
                  {...register('cronExpression')}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.expression}
                      type="button"
                      onClick={() =>
                        setValue('cronExpression', preset.expression, { shouldValidate: true })
                      }
                      className={cn(
                        'cursor-pointer rounded-md border px-2 py-0.5 text-[11px] transition-colors',
                        currentCronExpression === preset.expression
                          ? 'border-primary bg-accent font-medium text-accent-foreground'
                          : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {preset.label} (<span className="font-mono">{preset.expression}</span>)
                    </button>
                  ))}
                </div>
                {errors.cronExpression && (
                  <FieldDescription>{errors.cronExpression.message}</FieldDescription>
                )}
              </Field>

              <Field data-invalid={errors.timezone ? '' : undefined}>
                <FieldLabel htmlFor="job-timezone">Timezone</FieldLabel>
                <Input
                  id="job-timezone"
                  placeholder="America/Sao_Paulo"
                  className="font-mono text-xs"
                  {...register('timezone')}
                />
              </Field>
            </div>

            {/* Timeout & Retries */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="job-timeout">Timeout (ms)</FieldLabel>
                <Input
                  id="job-timeout"
                  type="number"
                  min={500}
                  max={120000}
                  step={500}
                  className="font-mono text-xs"
                  {...register('timeoutMs')}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="job-retries">Retentativas em falha (0–5)</FieldLabel>
                <Input
                  id="job-retries"
                  type="number"
                  min={0}
                  max={5}
                  className="font-mono text-xs"
                  {...register('maxRetries')}
                />
              </Field>
            </div>

            {/* Custom HTTP Headers */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Headers HTTP personalizados</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => append({ key: '', value: '' })}
                >
                  <PlusIcon data-icon="inline-start" />
                  Adicionar header
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {fields.map((fieldItem, rowIndex) => (
                  <div key={fieldItem.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Header (ex.: Authorization)"
                      className="font-mono text-xs"
                      aria-label={`Chave do header ${rowIndex + 1}`}
                      {...register(`headerEntries.${rowIndex}.key`)}
                    />
                    <Input
                      placeholder="Valor (ex.: Bearer token...)"
                      className="font-mono text-xs"
                      aria-label={`Valor do header ${rowIndex + 1}`}
                      {...register(`headerEntries.${rowIndex}.value`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover header ${rowIndex + 1}`}
                      onClick={() => remove(rowIndex)}
                      disabled={fields.length === 1}
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </Field>

            {/* Optional Request Body */}
            {selectedMethod !== 'GET' && selectedMethod !== 'DELETE' && (
              <Field>
                <FieldLabel htmlFor="job-body">Payload / Body (JSON ou texto)</FieldLabel>
                <Textarea
                  id="job-body"
                  placeholder='{"event": "scheduled_trigger"}'
                  className="min-h-20 font-mono text-xs"
                  {...register('body')}
                />
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner data-icon="inline-start" />}
              {isEditing ? 'Salvar alterações' : 'Criar CronJob'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
