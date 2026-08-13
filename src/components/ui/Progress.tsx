import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

export function ProgressRing({
  value,
  max,
  size = 132,
  children,
}: {
  value: number
  max: number
  size?: number
  children?: ReactNode
}) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1C1E22" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#B8FF3D"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-card2', className)}>
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}
