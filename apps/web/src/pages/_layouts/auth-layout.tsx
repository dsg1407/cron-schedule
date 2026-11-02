import { ThemeToggle } from '@/components/theme-toggle'
import { ClockIcon } from 'lucide-react'
import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background p-6 text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <ClockIcon aria-hidden="true" className="size-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight">CronFlow</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center py-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between text-xs text-muted-foreground">
        <span>CronFlow Telemetry & Scheduler</span>
        <span className="font-mono">v1.0.0</span>
      </footer>
    </div>
  )
}
