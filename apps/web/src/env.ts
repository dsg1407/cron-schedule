import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3333'),
  VITE_DONATION_PIX_KEY: z.string().min(1).default('dsg1407@gmail.com'),
  VITE_DONATION_SPONSOR_URL: z.string().url().default('https://github.com/sponsors/dsg1407'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env?.VITE_API_URL ?? 'http://localhost:3333',
  VITE_DONATION_PIX_KEY: import.meta.env?.VITE_DONATION_PIX_KEY ?? 'dsg1407@gmail.com',
  VITE_DONATION_SPONSOR_URL:
    import.meta.env?.VITE_DONATION_SPONSOR_URL ?? 'https://github.com/sponsors/dsg1407',
})
