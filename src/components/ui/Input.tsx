import { cn } from '@/utils/cn'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-12 w-full rounded-2xl border border-line bg-card2 px-4 text-base text-ink outline-none placeholder:text-muted focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}
