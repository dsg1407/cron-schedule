import { buildApp } from './app.js'
import { loadEnv } from './config/env.js'
import { makeApplication } from './factories/make-application.js'

async function startServer(): Promise<void> {
  const env = loadEnv()
  const application = makeApplication(env)

  await application.syncActiveCronJobs()

  const app = await buildApp(application, {
    logger: env.NODE_ENV !== 'test',
  })

  const gracefulShutdown = async () => {
    application.shutdown()
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)

  await app.listen({
    host: env.HOST,
    port: env.PORT,
  })
}

startServer().catch((error) => {
  console.error('Failed to start CronFlow API:', error)
  process.exit(1)
})
