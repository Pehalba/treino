import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function EditButton({
  to,
  label = 'Editar',
  className,
}: {
  to: string
  label?: string
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-card2 px-3 py-1.5 text-xs font-semibold text-muted',
        className,
      )}
    >
      <Pencil size={12} />
      {label}
    </Link>
  )
}
