import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper'
import {
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  type Exercise,
  type ExerciseSet,
  type SkipReason,
  type WorkoutSessionExercise,
} from '@/types'
import { formatTimer } from '@/utils/dates'
import { formatKg, formatNumber } from '@/utils/format'
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/utils/ids'
import { repsPattern, workingWeight } from '@/utils/volume'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Pencil } from 'lucide-react'

export function VideoModal({
  url,
  open,
  onClose,
  title = 'Execução',
}: {
  url: string
  open: boolean
  onClose: () => void
  title?: string
}) {
  const embed = youtubeEmbedUrl(url)
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe title={title} src={embed} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
        </div>
      ) : (
        <p className="text-sm text-muted">Vídeo ainda não cadastrado.</p>
      )}
      {url ? (
        <a href={youtubeWatchUrl(url)} target="_blank" rel="noreferrer" className="mt-4 block">
          <Button className="w-full" variant="secondary">
            Abrir no YouTube
          </Button>
        </a>
      ) : null}
    </Modal>
  )
}

export function ImageModal({
  url,
  open,
  onClose,
  title = 'Foto do exercício',
}: {
  url: string
  open: boolean
  onClose: () => void
  title?: string
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {url ? (
        <div className="overflow-hidden rounded-2xl bg-white">
          <img
            src={url}
            alt={title}
            className="mx-auto max-h-[70vh] w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Foto ainda não cadastrada.</p>
      )}
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
  plannedSets,
  weight,
  reps,
  increment,
  onWeight,
  onReps,
  onPlannedSets,
  onComplete,
  saving,
  savingLabel,
}: {
  setNumber: number
  plannedSets: number
  weight: number
  reps: number
  increment: number
  onWeight: (v: number) => void
  onReps: (v: number) => void
  onPlannedSets: (v: number) => void
  onComplete: () => void
  saving?: boolean
  savingLabel?: string
}) {
  return (
    <section className="mt-4 rounded-2xl bg-card p-3 sm:mt-5 sm:rounded-3xl sm:p-4">
      <h3 className="font-display text-base sm:text-lg">
        Série {setNumber} de {plannedSets}
      </h3>
      <p className="mt-2 text-xs text-muted sm:mt-3 sm:text-sm">Carga</p>
      <NumberStepper compact value={weight} onChange={onWeight} step={increment} suffix="kg" disabled={saving} />
      <p className="mt-3 text-xs text-muted sm:mt-4 sm:text-sm">Repetições</p>
      <NumberStepper compact value={reps} onChange={onReps} step={1} min={0} disabled={saving} />
      <p className="mt-3 text-xs text-muted sm:mt-4 sm:text-sm">Quantas séries vou fazer</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:mt-2 sm:gap-2">
        {[1, 2, 3, 4].map((value) => (
          <button
            key={value}
            type="button"
            disabled={saving}
            onClick={() => onPlannedSets(value)}
            className={cn(
              'min-h-10 rounded-xl text-sm font-semibold sm:min-h-12 sm:rounded-2xl disabled:opacity-50',
              plannedSets === value
                ? 'bg-accent font-bold text-[#08090B]'
                : 'bg-card2 text-ink',
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <Button className="mt-3 w-full sm:mt-5" size="lg" onClick={onComplete} disabled={saving}>
        {saving ? savingLabel || 'Carregando…' : '✓ Concluir série'}
      </Button>
    </section>
  )
}

export function EditSetModal({
  open,
  setNumber,
  weight,
  reps,
  increment,
  saving = false,
  onWeight,
  onReps,
  onClose,
  onSave,
}: {
  open: boolean
  setNumber: number
  weight: number
  reps: number
  increment: number
  saving?: boolean
  onWeight: (v: number) => void
  onReps: (v: number) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Editar série ${setNumber}`}>
      <p className="text-sm text-muted">Corrige o peso ou as reps se anotou errado.</p>
      <p className="mt-3 text-xs text-muted sm:mt-4 sm:text-sm">Carga</p>
      <NumberStepper compact value={weight} onChange={onWeight} step={increment} suffix="kg" />
      <p className="mt-3 text-xs text-muted sm:mt-4 sm:text-sm">Repetições</p>
      <NumberStepper compact value={reps} onChange={onReps} step={1} min={0} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </Modal>
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

export function ExerciseTimer({
  durationSeconds,
  remaining,
  running,
  onStart,
  onStop,
  onAdd,
  onEdit,
}: {
  durationSeconds: number
  remaining: number
  running: boolean
  onStart: () => void
  onStop: () => void
  onAdd: () => void
  onEdit: () => void
}) {
  const shown = running ? remaining : durationSeconds
  return (
    <section className="mt-4 rounded-2xl bg-card px-3 py-3">
      <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Timer</p>
      <p className={`mt-1 font-display text-3xl font-semibold leading-none ${running ? 'text-accent' : 'text-ink'}`}>
        {formatTimer(shown)}
      </p>
      <p className="mt-1 text-xs text-muted">
        {running ? 'Em andamento' : 'Opcional. Toque em iniciar quando quiser.'}
      </p>
      {running ? (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="secondary" onClick={onAdd}>
            +30s
          </Button>
          <Button size="sm" variant="secondary" onClick={onStop}>
            Parar
          </Button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <Button size="sm" onClick={onStart}>
            Iniciar
          </Button>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Alterar
          </Button>
        </div>
      )}
    </section>
  )
}

export function TimerEditModal({
  open,
  minutes,
  onMinutes,
  onClose,
  onSave,
}: {
  open: boolean
  minutes: number
  onMinutes: (value: number) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Alterar timer">
      <p className="text-sm text-muted">Esse valor fica salvo no seu perfil e vale para os próximos treinos.</p>
      <p className="mt-4 text-sm text-muted">Minutos</p>
      <NumberStepper value={minutes} onChange={onMinutes} step={0.5} min={0.25} suffix="min" />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[1, 1.5, 2, 3].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onMinutes(value)}
            className={`min-h-11 rounded-2xl text-sm font-semibold ${
              minutes === value ? 'bg-accent text-[#08090B]' : 'bg-card2'
            }`}
          >
            {String(value).replace('.', ',')}
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full" size="xl" onClick={onSave}>
        Salvar no perfil
      </Button>
    </Modal>
  )
}

export function TimerDoneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Timer terminou" className="timer-done-flash">
      <p className="text-sm text-muted">O tempo acabou. Pode seguir para a próxima série.</p>
      <Button className="mt-5 w-full" size="xl" onClick={onClose}>
        Ok
      </Button>
    </Modal>
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

export function AfterSkipModal({
  open,
  onClose,
  onNext,
  onChoose,
}: {
  open: boolean
  onClose: () => void
  onNext: () => void
  onChoose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="O que fazer agora?">
      <p className="mb-4 text-sm text-muted">
        Este exercício fica de lado neste treino. Você pode ir para o próximo da fila ou escolher outro da lista.
      </p>
      <div className="space-y-2">
        <Button className="w-full" size="xl" onClick={onNext}>
          Seguir para o próximo exercício
        </Button>
        <Button className="w-full" variant="secondary" size="xl" onClick={onChoose}>
          Escolher o exercício
        </Button>
        <Button className="w-full" variant="ghost" onClick={onClose}>
          ✕ Cancelar
        </Button>
      </div>
    </Modal>
  )
}

export function PickWorkoutExerciseModal({
  open,
  onClose,
  exercises,
  onPick,
}: {
  open: boolean
  onClose: () => void
  exercises: Array<{
    row: WorkoutSessionExercise
    name: string
    imageUrl?: string
    muscleLabel: string
  }>
  onPick: (exerciseId: string) => void
}) {
  const [photo, setPhoto] = useState<{ url: string; title: string } | null>(null)

  return (
    <>
      <Modal open={open} onClose={onClose} title="Escolher exercício">
        {exercises.length === 0 ? (
          <p className="text-sm text-muted">Não há outro exercício neste treino para fazer agora.</p>
        ) : (
          <div className="space-y-3">
            {exercises.map((item) => {
              const done = item.row.status === 'completed'
              const skipped = item.row.status === 'skipped'
              return (
                <div key={item.row.id} className="rounded-2xl bg-card2 p-3">
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <button
                        type="button"
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white"
                        onClick={() => setPhoto({ url: item.imageUrl!, title: item.name })}
                        aria-label={`Ver foto de ${item.name}`}
                      >
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-card text-xs text-muted">
                        Sem foto
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{item.name}</p>
                      <p className="mt-0.5 text-sm text-muted">{item.muscleLabel}</p>
                      {done ? <p className="mt-1 text-xs text-accent">Já feito hoje</p> : null}
                      {skipped ? <p className="mt-1 text-xs text-muted">Pulado hoje</p> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={!item.imageUrl}
                      onClick={() => item.imageUrl && setPhoto({ url: item.imageUrl, title: item.name })}
                    >
                      Ver foto
                    </Button>
                    <Button size="md" disabled={skipped} onClick={() => onPick(item.row.id)}>
                      Fazer esse
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Button className="mt-4 w-full" variant="ghost" onClick={onClose}>
          ← Voltar
        </Button>
      </Modal>
      <ImageModal
        url={photo?.url ?? ''}
        open={Boolean(photo)}
        onClose={() => setPhoto(null)}
        title={photo?.title ?? 'Foto do exercício'}
      />
    </>
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
  isLast = false,
  onEditSet,
  onNext,
}: {
  today: ExerciseSet[]
  previous: ExerciseSet[]
  message: string
  targetHit: boolean
  isRecord: boolean
  isLast?: boolean
  onEditSet?: (set: ExerciseSet) => void
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
      {today.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted">Séries de hoje — toque no lápis para corrigir</p>
          {today
            .slice()
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card2 px-4 py-3 text-sm"
              >
                <p>
                  Série {s.setNumber} · {s.weight} kg · {s.reps} reps
                </p>
                {onEditSet ? (
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted"
                    aria-label={`Editar série ${s.setNumber}`}
                    onClick={() => onEditSet(s)}
                  >
                    <Pencil size={16} />
                  </button>
                ) : null}
              </div>
            ))}
        </div>
      ) : null}
      <p className="mt-4 font-medium text-accent">📈 {message}</p>
      <Button className="mt-5 w-full" size="xl" onClick={onNext}>
        {isLast ? 'Finalizar treino ✓' : 'Próximo exercício →'}
      </Button>
    </section>
  )
}

export type WorkoutSummaryExercise = {
  name: string
  status: string
  sets: Array<{ setNumber: number; weight: number; reps: number }>
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
  withoutData = false,
  historyMode = false,
  dateLabel,
  exerciseDetails = [],
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
  withoutData?: boolean
  historyMode?: boolean
  dateLabel?: string
  exerciseDetails?: WorkoutSummaryExercise[]
  onHome: () => void
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className={cn('text-center', historyMode ? '' : 'pt-4')}>
        <p className="font-display text-3xl sm:text-4xl">
          {historyMode ? 'Detalhe do treino' : 'Treino concluído 🎉'}
        </p>
        <p className="mt-2 text-xl text-muted">{name}</p>
        {dateLabel ? <p className="mt-1 text-sm text-muted">{dateLabel}</p> : null}
        {withoutData ? (
          <p className="mt-3 text-sm text-muted">
            Concluído sem registrar — cargas iguais à última vez.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        <Stat label="Tempo" value={formatTimerSafe(duration)} />
        <Stat label="Exercícios" value={`${completed}/${total}`} />
        <Stat label="Séries" value={String(sets)} />
        <Stat label="Progressões" value={String(progressions)} />
        <Stat label="Recordes" value={String(records)} />
        <Stat label="Volume" value={`${formatNumber(volume, 0)} kg`} />
      </div>

      {records > 0 ? (
        <p className="mt-4 text-center text-sm font-semibold text-accent">
          🏆 {records} recorde(s) neste treino
        </p>
      ) : null}
      {progressions > 0 ? (
        <p className="mt-1 text-center text-sm text-muted">
          📈 {progressions} progressão(ões) vs última vez
        </p>
      ) : null}

      {exerciseDetails.length > 0 ? (
        <section className="mt-8 text-left">
          <h2 className="font-display text-lg tracking-wide uppercase">Exercícios</h2>
          <ul className="mt-3 space-y-3">
            {exerciseDetails.map((ex, i) => (
              <li key={`${ex.name}-${i}`} className="rounded-3xl bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{ex.name}</p>
                  <p className="shrink-0 text-xs text-muted">
                    {ex.status === 'skipped'
                      ? 'Pulado'
                      : `${ex.sets.length} ${ex.sets.length === 1 ? 'série' : 'séries'}`}
                  </p>
                </div>
                {ex.status === 'skipped' ? (
                  <p className="mt-2 text-sm text-muted">Exercício não realizado neste treino.</p>
                ) : ex.sets.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Sem séries registradas.</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {ex.sets.map((s) => (
                      <li
                        key={s.setNumber}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-muted">Série {s.setNumber}</span>
                        <span className="font-medium tabular-nums">
                          {formatKg(s.weight)} · {s.reps} reps
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button className="mt-8 w-full" size="xl" onClick={onHome}>
        {historyMode ? 'Voltar aos treinos' : 'Voltar ao início'}
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
