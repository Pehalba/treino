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
}

export function NumberStepper({ value, onChange, step = 1, min = 0, suffix }: Props) {
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

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card2 text-ink active:scale-95"
        onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
        aria-label="Diminuir"
      >
        <Minus />
      </button>
      {editing ? (
        <input
          autoFocus
          inputMode="decimal"
          className="h-14 min-w-24 flex-1 rounded-2xl bg-card2 text-center text-2xl font-semibold outline-none"
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
          className={cn('h-14 min-w-24 flex-1 rounded-2xl bg-card2 text-center text-2xl font-semibold')}
          onClick={() => {
            setDraft(String(value).replace('.', ','))
            setEditing(true)
          }}
        >
          {String(value).replace('.', ',')}
          {suffix ? <span className="ml-1 text-base text-muted">{suffix}</span> : null}
        </button>
      )}
      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card2 text-ink active:scale-95"
        onClick={() => onChange(Number((value + step).toFixed(2)))}
        aria-label="Aumentar"
      >
        <Plus />
      </button>
    </div>
  )
}
