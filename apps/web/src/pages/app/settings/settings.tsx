import { type GetProfileResponse, getProfile } from '@/api/get-profile'
import { purgeExecutions } from '@/api/purge-executions'
import { updateSettings } from '@/api/update-settings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/primitives'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SaveIcon, Trash2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const settingsFormSchema = z.object({
  name: z.string().min(2, 'Informe seu nome.'),
  defaultTimezone: z.string().min(1, 'Informe o timezone padrão.'),
  defaultTimeoutMs: z.coerce.number().int().min(1000).max(120000),
  defaultMaxRetries: z.coerce.number().int().min(0).max(5),
  retentionDays: z.coerce.number().int().min(1).max(365),
})

type SettingsFormSchema = z.infer<typeof settingsFormSchema>

export function Settings() {
  const queryClient = useQueryClient()

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SettingsFormSchema>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: '',
      defaultTimezone: 'America/Sao_Paulo',
      defaultTimeoutMs: 30000,
      defaultMaxRetries: 1,
      retentionDays: 30,
    },
  })

  useEffect(() => {
    if (profileData?.user) {
      reset({
        name: profileData.user.name,
        defaultTimezone: profileData.user.defaultTimezone,
        defaultTimeoutMs: profileData.user.defaultTimeoutMs,
        defaultMaxRetries: profileData.user.defaultMaxRetries,
        retentionDays: profileData.user.retentionDays,
      })
    }
  }, [profileData, reset])

  const { mutateAsync: updateSettingsFn, isPending: isSaving } = useMutation({
    mutationFn: updateSettings,
    onSuccess(data) {
      queryClient.setQueryData<GetProfileResponse>(['profile'], { user: data.user })
    },
  })

  const { mutateAsync: purgeExecutionsFn, isPending: isPurging } = useMutation({
    mutationFn: purgeExecutions,
  })

  async function handleSaveSettings(values: SettingsFormSchema) {
    try {
      await updateSettingsFn(values)
      toast.success('Configurações atualizadas com sucesso.')
    } catch {
      toast.error('Não foi possível salvar as configurações.')
    }
  }

  const currentRetentionDays = watch('retentionDays')

  async function handlePurgeNow() {
    try {
      const { deletedCount } = await purgeExecutionsFn({
        olderThanDays: currentRetentionDays,
      })
      toast.success(`${deletedCount} registros antigos foram removidos do histórico.`)
    } catch {
      toast.error('Falha ao limpar registros antigos.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil, parâmetros padrão de execução HTTP e retenção de logs.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil & Parâmetros Padrão</CardTitle>
            <CardDescription>
              Esses valores serão preenchidos por padrão ao criar novos CronJobs.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={errors.name ? '' : undefined}>
                <FieldLabel htmlFor="settings-name">Nome de exibição</FieldLabel>
                <Input
                  id="settings-name"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                {errors.name && <FieldDescription>{errors.name.message}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-timezone">Timezone padrão</FieldLabel>
                <Input
                  id="settings-timezone"
                  className="font-mono text-xs"
                  {...register('defaultTimezone')}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-timeout">Timeout HTTP padrão (ms)</FieldLabel>
                <Input
                  id="settings-timeout"
                  type="number"
                  className="font-mono text-xs"
                  {...register('defaultTimeoutMs')}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-retries">Retentativas padrão (0–5)</FieldLabel>
                <Input
                  id="settings-retries"
                  type="number"
                  className="font-mono text-xs"
                  {...register('defaultMaxRetries')}
                />
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              Salvar configurações
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retenção de Histórico</CardTitle>
            <CardDescription>
              Limpe execuções antigas para manter o banco SQLite enxuto e veloz.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Field className="max-w-xs">
              <FieldLabel htmlFor="settings-retention">
                Manter histórico dos últimos (dias)
              </FieldLabel>
              <Input
                id="settings-retention"
                type="number"
                min={1}
                max={365}
                className="font-mono text-xs"
                {...register('retentionDays')}
              />
            </Field>
          </CardContent>

          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">
              Remove execuções anteriores a {currentRetentionDays} dias atrás.
            </span>
            <Button type="button" variant="outline" disabled={isPurging} onClick={handlePurgeNow}>
              {isPurging ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Trash2Icon data-icon="inline-start" />
              )}
              Executar limpeza agora
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
