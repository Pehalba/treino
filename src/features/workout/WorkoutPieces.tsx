import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Exercise, type ExerciseSet, type RirValue, type SkipReason } from '@/types'
import { formatKg, formatNumber } from '@/utils/format'
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/utils/ids'
import { repsPattern, workingWeight } from '@/utils/volume'
import { cn } from '@/utils/cn'

export function VideoModal({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
  const embed = youtubeEmbedUrl(url)
  return (
    <Modal open={open} onClose={onClose} title="Execução">
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe title="Vídeo do exercício" src={embed} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
        </div>
      ) : (
        <p className="text-sm text-muted">Vídeo ainda não cadastrado para este exercício.</p>
      )}
      <a href={youtubeWatchUrl(url)} target="_blank" rel="noreferrer" className="mt-4 block">
        <Button className="w-full" variant="secondary">
          Abrir no YouTube
        </Button>
      </a>
    </Modal>
  )
}

export function LastTime({ sets }: { sets: ExerciseSet[] }) {
  if (sets.length === 0) {
    return <p className="text-sm text-muted">Primeira vez neste exercício.</p>
  }
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Última vez</p>
      <p className="mt-1 text-lg font-semibold">{formatKg(workingWeight(sets))} por série</p>
      <ul className="mt-1 text-sm text-muted">
        {sets.map((s) => (
          <li key={s.id}>
            Série {s.setNumber} — {s.reps} reps
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SetForm({
  setNumber,
  weight,
  reps,
  rir,
  increment,
  onWeight,
  onReps,
  onRir,
  onComplete,
}: {
  setNumber: number
  weight: number
  reps: number
  rir: RirValue
  increment: number
  onWeight: (v: number) => void
  onReps: (v: number) => void
  onRir: (v: RirValue) => void
  onComplete: () => void
}) {
  return (
    <section className="mt-5 rounded-3xl bg-card p-4">
      <h3 className="font-display text-lg">Série {setNumber}</h3>
      <p className="mt-3 text-sm text-muted">Carga</p>
      <NumberStepper value={weight} onChange={onWeight} step={increment} suffix="kg" />
      <p className="mt-4 text-sm text-muted">Repetições</p>
      <NumberStepper value={reps} onChange={onReps} step={1} min={0} />
      <p className="mt-4 text-sm text-muted">RIR</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {([0, 1, 2, 3] as RirValue[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRir(value)}
            className={cn(
              'min-h-12 rounded-2xl bg-card2 text-sm font-semibold',
              rir === value && 'bg-accent text-bg',
            )}
          >
            {value === 3 ? '3+' : value}
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full" size="xl" onClick={onComplete}>
        ✓ Concluir série
      </Button>
    </section>
  )
}

export function RestOverlay({
  remaining,
  onAdd,
  onSkip,
}: {
  remaining: number
  onAdd: () => void
  onSkip: () => void
}) {
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 text-center">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">Descanso</p>
        <p className="mt-2 font-display text-6xl font-semibold text-accent">
          {mm}:{ss}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onAdd}>
            +30s
          </Button>
          <Button onClick={onSkip}>Pular</Button>
        </div>
      </div>
    </div>
  )
}

export function SkipModal({
  open,
  onClose,
  onReason,
}: {
  open: boolean
  onClose: () => void
  onReason: (reason: SkipReason) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Por que deseja alterar?">
      <div className="space-y-2">
        <Button className="w-full" variant="secondary" onClick={() => onReason('occupied')}>
          👥 Equipamento ocupado
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => onReason('want_other')}>
          🔄 Quero outro exercício
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => onReason('cannot_today')}>
          ⚠️ Não consigo realizar hoje
        </Button>
        <Button className="w-full" variant="ghost" onClick={onClose}>
          ✕ Cancelar
        </Button>
      </div>
    </Modal>
  )
}

export function OccupiedModal({
  open,
  onClose,
  onDefer,
  onReplace,
}: {
  open: boolean
  onClose: () => void
  onDefer: () => void
  onReplace: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="O que você deseja fazer?">
      <div className="space-y-2">
        <Button className="w-full" size="xl" onClick={onDefer}>
          Ir para outro exercício
        </Button>
        <Button className="w-full" variant="secondary" size="xl" onClick={onReplace}>
          Substituir exercício
        </Button>
      </div>
    </Modal>
  )
}

export function ReplaceModal({
  open,
  onClose,
  alternatives,
  onPick,
}: {
  open: boolean
  onClose: () => void
  alternatives: Exercise[]
  onPick: (exercise: Exercise) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Exercícios equivalentes">
      {alternatives.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma alternativa cadastrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {alternatives.map((ex) => (
            <div key={ex.id} className="rounded-2xl bg-card2 p-3">
              <p className="font-semibold">{ex.name}</p>
              <p className="text-sm text-muted">
                {MUSCLE_LABELS[ex.muscleGroup]} · {EQUIPMENT_LABELS[ex.equipment]}
              </p>
              <Button className="mt-3 w-full" onClick={() => onPick(ex)}>
                Usar somente hoje
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export function ExerciseDone({
  today,
  previous,
  message,
  targetHit,
  isRecord,
  onNext,
}: {
  today: ExerciseSet[]
  previous: ExerciseSet[]
  message: string
  targetHit: boolean
  isRecord: boolean
  onNext: () => void
}) {
  return (
    <section className="mt-4 rounded-3xl bg-card p-5">
      <p className="font-display text-2xl">✅ Exercício concluído</p>
      {isRecord ? <p className="mt-2 font-semibold text-accent">Novo recorde 🏆</p> : null}
      {targetHit ? (
        <p className="mt-2 text-sm">
          🎯 Meta atingida. Considere aumentar a carga na próxima sessão.
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted">Hoje</p>
          <p className="text-lg font-semibold">{formatKg(workingWeight(today))}</p>
          <p>{repsPattern(today) || '—'}</p>
        </div>
        <div>
          <p className="text-muted">Última vez</p>
          <p className="text-lg font-semibold">
            {previous.length ? formatKg(workingWeight(previous)) : '—'}
          </p>
          <p>{previous.length ? repsPattern(previous) : '—'}</p>
        </div>
      </div>
      <p className="mt-4 font-medium text-accent">📈 {message}</p>
      <Button className="mt-5 w-full" size="xl" onClick={onNext}>
        Próximo exercício →
      </Button>
    </section>
  )
}

export function WorkoutSummary({
  name,
  duration,
  completed,
  total,
  sets,
  progressions,
  records,
  volume,
  onHome,
}: {
  name: string
  duration: number
  completed: number
  total: number
  sets: number
  progressions: number
  records: number
  volume: number
  onHome: () => void
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5 py-10 text-center">
      <p className="font-display text-4xl">Treino concluído 🎉</p>
      <p className="mt-2 text-xl text-muted">{name}</p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        <Stat label="Tempo" value={formatTimerSafe(duration)} />
        <Stat label="Exercícios" value={`${completed}/${total}`} />
        <Stat label="Séries" value={String(sets)} />
        <Stat label="Progressões" value={String(progressions)} />
        <Stat label="Recordes" value={String(records)} />
        <Stat label="Volume" value={`${formatNumber(volume, 0)} kg`} />
      </div>
      <Button className="mt-8 w-full" size="xl" onClick={onHome}>
        Voltar ao início
      </Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

function formatTimerSafe(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, '0')}`
  return `${minutes} min`
}
