import { cn } from '@/utils/cn'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-base text-ink outline-none placeholder:text-muted focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}
