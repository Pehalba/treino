import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { parseLocaleNumber } from '@/utils/format'
import { cn } from '@/utils/cn'

type Props = {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  suffix?: string
  compact?: boolean
  disabled?: boolean
}

export function NumberStepper({ value, onChange, step = 1, min = 0, suffix, compact = false, disabled = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function commit(raw: string) {
    const parsed = parseLocaleNumber(raw)
    if (parsed == null) {
      setDraft(String(value))
      setEditing(false)
      return
    }
    onChange(Math.max(min, parsed))
    setEditing(false)
  }

  const sideBtn = compact
    ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-card2 text-ink active:scale-95 disabled:opacity-40 sm:h-14 sm:w-14 sm:rounded-2xl'
    : 'flex h-14 w-14 items-center justify-center rounded-2xl bg-card2 text-ink active:scale-95 disabled:opacity-40'
  const valueBtn = compact
    ? 'h-11 min-w-20 flex-1 rounded-xl bg-card2 text-center text-xl font-semibold sm:h-14 sm:min-w-24 sm:rounded-2xl sm:text-2xl'
    : 'h-14 min-w-24 flex-1 rounded-2xl bg-card2 text-center text-2xl font-semibold'
  const iconSize = compact ? 18 : 24

  return (
    <div className={cn('flex items-center', compact ? 'gap-2 sm:gap-3' : 'gap-3')}>
      <button
        type="button"
        className={sideBtn}
        disabled={disabled}
        onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
        aria-label="Diminuir"
      >
        <Minus size={iconSize} />
      </button>
      {editing ? (
        <input
          autoFocus
          inputMode="decimal"
          className={cn(valueBtn, 'outline-none')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(draft)
          }}
        />
      ) : (
        <button
          type="button"
          className={valueBtn}
          disabled={disabled}
          onClick={() => {
            setDraft(String(value).replace('.', ','))
            setEditing(true)
          }}
        >
          {String(value).replace('.', ',')}
          {suffix ? (
            <span className={cn('ml-1 text-muted', compact ? 'text-sm sm:text-base' : 'text-base')}>
              {suffix}
            </span>
          ) : null}
        </button>
      )}
      <button
        type="button"
        className={sideBtn}
        disabled={disabled}
        onClick={() => onChange(Number((value + step).toFixed(2)))}
        aria-label="Aumentar"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  )
}
