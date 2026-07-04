import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatBarProps {
  label: string
  value: number
  icon: ReactNode
  barClassName: string
}

export function StatBar({ label, value, icon, barClassName }: StatBarProps) {
  const rounded = Math.round(value)
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
        {icon}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-muted-foreground">{label}</span>
          <span className="text-xs font-extrabold tabular-nums">{rounded}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={rounded}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2.5 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', barClassName)}
            style={{ width: `${rounded}%` }}
          />
        </div>
      </div>
    </div>
  )
}
