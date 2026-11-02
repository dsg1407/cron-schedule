export function formatDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined) {
    return '—'
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`
  }

  if (durationMs < 60000) {
    const seconds = (durationMs / 1000).toFixed(1).replace(/\.0$/, '')
    return `${seconds}s`
  }

  const minutes = Math.round(durationMs / 60000)
  return `${minutes}m`
}

export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return 'Nunca executado'
  }

  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) {
    return '—'
  }

  const diffSeconds = Math.round((Date.now() - timestamp) / 1000)

  if (diffSeconds < -60) {
    const futureMinutes = Math.round(Math.abs(diffSeconds) / 60)
    if (futureMinutes < 60) {
      return `em ${futureMinutes}min`
    }
    const futureHours = Math.round(futureMinutes / 60)
    if (futureHours < 24) {
      return `em ${futureHours}h`
    }
    return `em ${Math.round(futureHours / 24)}d`
  }

  if (diffSeconds < 60) {
    return 'agora mesmo'
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `há ${diffMinutes}min`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `há ${diffHours}h`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `há ${diffDays}d`
}

export function formatShortDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return 'Sem registro'
  }

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}
