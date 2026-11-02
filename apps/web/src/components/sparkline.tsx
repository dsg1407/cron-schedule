import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export interface SparklineProps extends Omit<ComponentProps<'svg'>, 'values'> {
  values: number[]
  tone?: 'info' | 'success' | 'purple'
}

export function Sparkline({ values, tone = 'info', className, ...props }: SparklineProps) {
  const safeValues = values.length >= 2 ? values : [2, 4, 3, 6, 5, 8, 7, 9]
  const minVal = Math.min(...safeValues)
  const maxVal = Math.max(...safeValues)
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal

  const width = 76
  const height = 28
  const padding = 3

  const points = safeValues
    .map((numericValue, pointIndex) => {
      const xCoord = padding + (pointIndex / (safeValues.length - 1)) * (width - padding * 2)
      const yCoord = height - padding - ((numericValue - minVal) / range) * (height - padding * 2)
      return `${xCoord.toFixed(1)},${yCoord.toFixed(1)}`
    })
    .join(' ')

  const toneColorClass =
    tone === 'success'
      ? 'text-status-success-dot'
      : tone === 'purple'
        ? 'text-status-purple-text'
        : 'text-status-info-dot'

  return (
    <svg
      aria-hidden="true"
      data-slot="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={twMerge('h-7 w-19 shrink-0 overflow-visible', toneColorClass, className)}
      {...props}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
