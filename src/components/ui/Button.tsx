import { cn } from '@/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Button({ className, variant = 'primary', size = 'lg', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'min-h-9 rounded-xl px-3 text-xs',
        size === 'md' && 'min-h-11 px-4 text-sm',
        size === 'lg' && 'min-h-12 px-5 text-base',
        size === 'xl' && 'min-h-14 px-6 text-base',
        variant === 'primary' && 'bg-accent text-bg',
        variant === 'secondary' && 'bg-card2 text-ink',
        variant === 'ghost' && 'bg-transparent text-muted',
        variant === 'danger' && 'bg-danger/15 text-danger',
        className,
      )}
      {...props}
    />
  )
}
