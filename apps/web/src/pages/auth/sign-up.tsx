import { signUp } from '@/api/sign-up'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/primitives'
import { setStoredAuthToken } from '@/lib/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { UserPlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

const signUpFormSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

type SignUpFormSchema = z.infer<typeof signUpFormSchema>

export function SignUp() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormSchema>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const { mutateAsync: signUpFn, isPending: isSigningUp } = useMutation({
    mutationFn: signUp,
  })

  async function handleSignUp(formData: SignUpFormSchema) {
    try {
      const response = await signUpFn(formData)
      setStoredAuthToken(response.token)
      toast.success('Conta criada com sucesso.')
      navigate('/', { replace: true })
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Não foi possível criar a conta.'
      toast.error(message)
    }
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl">Criar conta no CronFlow</CardTitle>
        <CardDescription>
          Configure serviços, cabeçalhos HTTP e expressões cron em segundos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleSignUp)} className="flex flex-col gap-5">
          <FieldGroup>
            <Field data-invalid={errors.name ? '' : undefined}>
              <FieldLabel htmlFor="signup-name">Nome completo</FieldLabel>
              <Input
                id="signup-name"
                placeholder="Diego Gonçalves"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name && <FieldDescription>{errors.name.message}</FieldDescription>}
            </Field>

            <Field data-invalid={errors.email ? '' : undefined}>
              <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                placeholder="voce@empresa.com"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <FieldDescription>{errors.email.message}</FieldDescription>}
            </Field>

            <Field data-invalid={errors.password ? '' : undefined}>
              <FieldLabel htmlFor="signup-password">Senha</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                placeholder="Mínimo de 6 caracteres"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && <FieldDescription>{errors.password.message}</FieldDescription>}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isSigningUp} className="w-full">
            {isSigningUp ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <UserPlusIcon data-icon="inline-start" />
            )}
            Criar conta e entrar
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Já possui uma conta?{' '}
            <Link to="/sign-in" className="font-semibold text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
