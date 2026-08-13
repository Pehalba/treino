import { cn } from '@/utils/cn'
import type { SelectHTMLAttributes } from 'react'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-12 w-full rounded-2xl border border-line bg-card2 px-4 text-base text-ink outline-none focus:border-accent',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
