import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <button className="absolute inset-0" aria-label="Fechar" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg rounded-3xl bg-card p-5 shadow-2xl', className)}>
        {title ? <h2 className="mb-4 font-display text-xl font-semibold">{title}</h2> : null}
        {children}
      </div>
    </div>
  )
}
