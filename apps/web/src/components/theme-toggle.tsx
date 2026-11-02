import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cronflow:color-scheme'

type ResolvedScheme = 'light' | 'dark'

function getSystemScheme(): ResolvedScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialScheme(): ResolvedScheme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return 'light'
}

function syncDocumentScheme(resolved: ResolvedScheme, storedOverride: ResolvedScheme | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')

  const metaTag = document.querySelector('meta[name="color-scheme"]')
  if (metaTag) {
    metaTag.setAttribute('content', storedOverride ?? 'light dark')
  }
}

export function ThemeToggle() {
  const [scheme, setScheme] = useState<ResolvedScheme>(() => getInitialScheme())

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ResolvedScheme | null
    syncDocumentScheme(scheme, stored)
  }, [scheme])

  function handleToggleTheme() {
    const targetScheme: ResolvedScheme = scheme === 'dark' ? 'light' : 'dark'
    const systemScheme = getSystemScheme()

    if (targetScheme === systemScheme) {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
      syncDocumentScheme(targetScheme, null)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, targetScheme)
      syncDocumentScheme(targetScheme, targetScheme)
    }

    setScheme(targetScheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={scheme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      onClick={handleToggleTheme}
    >
      {scheme === 'dark' ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  )
}
