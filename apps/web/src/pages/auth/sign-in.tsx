import { signIn } from '@/api/sign-in'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/primitives'
import { setStoredAuthToken } from '@/lib/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRightIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

const signInFormSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

type SignInFormSchema = z.infer<typeof signInFormSchema>

export function SignIn() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormSchema>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { mutateAsync: signInFn, isPending: isSigningIn } = useMutation({
    mutationFn: signIn,
  })

  async function handleSignIn(formData: SignInFormSchema) {
    try {
      const response = await signInFn(formData)
      setStoredAuthToken(response.token)
      toast.success('Sessão iniciada com sucesso.')
      navigate('/', { replace: true })
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Não foi possível entrar.'
      toast.error(message)
    }
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl">Entrar no CronFlow</CardTitle>
        <CardDescription>
          Monitore seus agendamentos HTTP, tempos de resposta e payloads recebidos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleSignIn)} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={errors.email ? '' : undefined}>
              <FieldLabel htmlFor="signin-email">E-mail</FieldLabel>
              <Input
                id="signin-email"
                type="email"
                placeholder="voce@empresa.com"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <FieldDescription>{errors.email.message}</FieldDescription>}
            </Field>

            <Field data-invalid={errors.password ? '' : undefined}>
              <FieldLabel htmlFor="signin-password">Senha</FieldLabel>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && <FieldDescription>{errors.password.message}</FieldDescription>}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isSigningIn} className="w-full">
            {isSigningIn ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ArrowRightIcon data-icon="inline-end" />
            )}
            Acessar painel
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Ainda não possui conta?{' '}
            <Link to="/sign-up" className="font-semibold text-primary hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
