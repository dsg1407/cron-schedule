import { getProfile } from '@/api/get-profile'
import { DonationDialog } from '@/components/donation-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getStoredAuthToken, setStoredAuthToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import {
  BellIcon,
  CalendarClockIcon,
  ChevronDownIcon,
  ClockIcon,
  HeartIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  LogOutIcon,
  PlayIcon,
  SettingsIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'

const NAVIGATION_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGridIcon, end: true },
  { to: '/cron-jobs', label: 'CronJobs', icon: CalendarClockIcon, end: false },
  { to: '/executions', label: 'Execuções', icon: PlayIcon, end: false },
  { to: '/settings', label: 'Configurações', icon: SettingsIcon, end: false },
]

function getInitials(name: string | undefined): string {
  if (!name) return 'DG'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return (words[0]?.slice(0, 2) ?? 'DG').toUpperCase()
  }
  return `${words[0]?.[0] ?? 'D'}${words[words.length - 1]?.[0] ?? 'G'}`.toUpperCase()
}

export function AppLayout() {
  const navigate = useNavigate()
  const token = getStoredAuthToken()
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/sign-in', { replace: true })
    }
  }, [token, navigate])

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
    enabled: Boolean(token),
  })

  function handleSignOut() {
    setStoredAuthToken(null)
    navigate('/sign-in', { replace: true })
  }

  const userInitials = getInitials(profileData?.user.name)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-border bg-surface px-3.5 py-5">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 px-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <ClockIcon aria-hidden="true" className="size-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">CronFlow</span>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Navegação principal" className="flex flex-col gap-1">
            {NAVIGATION_ITEMS.map((navItem) => {
              const IconComponent = navItem.icon
              return (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
                  end={navItem.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <IconComponent aria-hidden="true" className="size-4 shrink-0" />
                  <span>{navItem.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-1.5 border-t border-border pt-4 px-2.5">
          <NavLink
            to="/docs"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <HelpCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>Ajuda & Documentação</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setIsDonationDialogOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HeartIcon aria-hidden="true" className="size-4 shrink-0 text-destructive" />
            <span>Apoiar o projeto</span>
          </button>

          <span className="mt-1 px-2 font-mono text-[11px] text-muted-foreground">
            v1.0.0 • MIT
          </span>
        </div>
      </aside>

      <DonationDialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="flex h-15 items-center justify-end gap-2.5 border-b border-border bg-surface/70 px-8 backdrop-blur-xs">
          <ThemeToggle />

          <button
            type="button"
            aria-label="Ver histórico de execuções recentes"
            onClick={() => navigate('/executions')}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BellIcon aria-hidden="true" className="size-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Menu do usuário"
              className="flex items-center gap-2 rounded-full border border-border bg-secondary/70 py-1 pl-1.5 pr-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {userInitials}
              </span>
              <span className="hidden sm:inline">{profileData?.user.name ?? 'Usuário'}</span>
              <ChevronDownIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent sideOffset={8}>
              <DropdownMenuGroup>
                <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {profileData?.user.name ?? 'Conta CronFlow'}
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {profileData?.user.email ?? ''}
                  </span>
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <SettingsIcon aria-hidden="true" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive data-[highlighted]:bg-status-danger-bg"
                >
                  <LogOutIcon aria-hidden="true" />
                  <span>Sair da conta</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Container */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
