import { z } from 'zod'
import { userResponseSchema } from './profile.schema.js'

export const registerUserBodySchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

export const authenticateUserBodySchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

export const authSuccessResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema,
})
