import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'
import { useFeedback } from '@/hooks/useFeedback'
import { useSession } from '@/hooks/useSession'
import { exerciseService } from '@/services/exerciseService'
import { workoutEditorService } from '@/services/workoutEditorService'
import { workoutService } from '@/services/workoutService'
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type Exercise,
  type TemplateWithMeta,
  type WorkoutTemplateExercise,
} from '@/types'
import { isLive } from '@/utils/audit'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const HISTORY_WARNING =
  'Essa alteração será aplicada aos próximos treinos. Seu histórico anterior não será alterado.'

export function WorkoutEditPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { user, activeProfile } = useSession()
  const { message, show } = useFeedback()
  const [template, setTemplate] = useState<TemplateWithMeta | null>(null)
  const [catalog, setCatalog] = useState<Exercise[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [removeRow, setRemoveRow] = useState<WorkoutTemplateExercise | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pickId, setPickId] = useState('')
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState<(typeof MUSCLE_GROUPS)[number]>('chest')
  const [newEquip, setNewEquip] = useState<(typeof EQUIPMENT)[number]>('dumbbell')

  async function load() {
    if (!activeProfile || !templateId) return
    setLoading(true)
    setError('')
    try {
      const [templates, exercises] = await Promise.all([
        workoutService.getTemplatesWithMeta(activeProfile.id, activeProfile.householdId),
        exerciseService.listByHousehold(activeProfile.householdId),
      ])
      const found = templates.find((item) => item.id === templateId) ?? null
      setTemplate(found)
      setName(found?.name ?? '')
      setCatalog(exercises.filter(isLive))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir o treino.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeProfile?.id, templateId])

  const rows = template?.exercises ?? []
  const unused = useMemo(() => {
    const used = new Set(rows.map((row) => row.exerciseId))
    return catalog.filter((item) => !used.has(item.id))
  }, [catalog, rows])

  async function saveName() {
    if (!user || !template) return
    const next = name.trim()
    if (!next || next === template.name) return
    try {
      await workoutEditorService.updateTemplateName(template.id, next, user.id)
      setTemplate({ ...template, name: next })
      setName(next)
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o nome.')
    }
  }

  async function saveRow(
    row: TemplateWithMeta['exercises'][number],
    data: Partial<Pick<WorkoutTemplateExercise, 'sets' | 'repMin' | 'repMax' | 'restSeconds' | 'notes'>>,
  ) {
    if (!user || !template) return
    try {
      await workoutEditorService.updateTemplateExercise(row.id, data, user.id)
      setTemplate({
        ...template,
        exercises: template.exercises.map((item) => (item.id === row.id ? { ...item, ...data } : item)),
      })
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    }
  }

  async function saveExercise(
    row: TemplateWithMeta['exercises'][number],
    exercise: Exercise,
    data: Partial<Exercise>,
  ) {
    if (!user || !activeProfile || !template) return
    try {
      const result = await workoutEditorService.updateExerciseInTemplate({
        profileId: activeProfile.id,
        householdId: activeProfile.householdId,
        templateExerciseId: row.id,
        exercise,
        data,
        userId: user.id,
      })
      const next = result.exercise
      setCatalog((items) => {
        if (result.exerciseIdChanged) return [...items.filter((item) => item.id !== next.id), next]
        return items.map((item) => (item.id === exercise.id ? next : item))
      })
      setTemplate({
        ...template,
        exercises: template.exercises.map((item) =>
          item.id === row.id
            ? { ...item, exerciseId: next.id, exercise: next }
            : item.exerciseId === exercise.id && !result.exerciseIdChanged
              ? { ...item, exercise: next }
              : item,
        ),
      })
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o exercício.')
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!user || !template) return
    const next = index + dir
    if (next < 0 || next >= rows.length) return
    const copy = [...rows]
    const current = copy[index]
    const swap = copy[next]
    if (!current || !swap) return
    copy[index] = swap
    copy[next] = current
    setTemplate({ ...template, exercises: copy })
    await workoutEditorService.reorderTemplateExercises(copy, user.id)
    show()
  }

  async function confirmRemove() {
    if (!user || !template || !removeRow) return
    await workoutEditorService.archiveTemplateExercise(removeRow.id, user.id)
    setTemplate({ ...template, exercises: template.exercises.filter((row) => row.id !== removeRow.id) })
    setRemoveRow(null)
    show()
  }

  async function addExisting() {
    if (!user || !activeProfile || !template || !pickId) return
    const row = await workoutEditorService.addExistingExercise({
      profile: activeProfile,
      template,
      exerciseId: pickId,
      userId: user.id,
      order: rows.length,
    })
    const exercise = catalog.find((item) => item.id === pickId) ?? null
    setTemplate({ ...template, exercises: [...template.exercises, { ...row, exercise }] })
    setAddOpen(false)
    setPickId('')
    show()
  }

  async function addNew() {
    if (!user || !activeProfile || !template) return
    const created = await workoutEditorService.createAndAddExercise({
      profile: activeProfile,
      template,
      userId: user.id,
      order: rows.length,
      name: newName,
      muscleGroup: newMuscle,
      equipment: newEquip,
    })
    setCatalog((items) => [...items, created.exercise])
    setTemplate({ ...template, exercises: [...template.exercises, { ...created.row, exercise: created.exercise }] })
    setAddOpen(false)
    setNewName('')
    show()
  }

  async function toggleAlts(
    row: TemplateWithMeta['exercises'][number],
    exercise: Exercise,
    altId: string,
  ) {
    const next = exercise.alternativeIds.includes(altId)
      ? exercise.alternativeIds.filter((id) => id !== altId)
      : [...exercise.alternativeIds, altId]
    await saveExercise(row, exercise, { alternativeIds: next })
  }

  return (
    <AppShell title="Editar treino">
      <Toast message={message} />
      <Button variant="ghost" className="mb-4 px-0" onClick={() => navigate(-1)}>
        ← Voltar
      </Button>
      {loading ? (
        <Skeleton className="h-64" />
      ) : !template ? (
        <p className="text-sm text-muted">{error || 'Treino não encontrado.'}</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            {HISTORY_WARNING} Alterações no nome/vídeo deste treino não mudam os treinos dos outros
            perfis.
          </p>
          <Card>
            <label className="text-sm text-muted">
              Nome do treino
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => void saveName()}
              />
            </label>
            <Button className="mt-3 w-full" onClick={() => void saveName()}>
              Salvar nome
            </Button>
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-lg">Exercícios</h2>
            <Button size="md" variant="secondary" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Adicionar
            </Button>
          </div>

          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

          <div className="mt-3 space-y-3">
            {rows.map((row, index) => {
              const exercise = row.exercise
              const open = expanded === row.id
              return (
                <Card key={row.id}>
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="text-left" onClick={() => setExpanded(open ? null : row.id)}>
                      <p className="font-display text-lg">{exercise?.name ?? 'Exercício'}</p>
                      <p className="text-sm text-muted">
                        {row.sets} séries · {row.repMin}–{row.repMax} reps
                      </p>
                    </button>
                    <div className="flex gap-1">
                      <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => void move(index, -1)}>
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => void move(index, 1)}>
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                  {open && exercise ? (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm text-muted">
                        Nome do exercício
                        <Input
                          className="mt-1"
                          defaultValue={exercise.name}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== exercise.name) void saveExercise(row, exercise, { name: e.target.value })
                          }}
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-sm text-muted">
                          Grupo muscular
                          <Select
                            className="mt-1"
                            value={exercise.muscleGroup}
                            onChange={(e) => void saveExercise(row, exercise, { muscleGroup: e.target.value as Exercise['muscleGroup'] })}
                          >
                            {MUSCLE_GROUPS.map((group) => (
                              <option key={group} value={group}>
                                {MUSCLE_LABELS[group]}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <label className="text-sm text-muted">
                          Equipamento
                          <Select
                            className="mt-1"
                            value={exercise.equipment}
                            onChange={(e) => void saveExercise(row, exercise, { equipment: e.target.value as Exercise['equipment'] })}
                          >
                            {EQUIPMENT.map((item) => (
                              <option key={item} value={item}>
                                {EQUIPMENT_LABELS[item]}
                              </option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="text-sm text-muted">
                          Séries
                          <Input
                            className="mt-1"
                            type="number"
                            defaultValue={row.sets}
                            onBlur={(e) => void saveRow(row, { sets: Number(e.target.value) || 3 })}
                          />
                        </label>
                        <label className="text-sm text-muted">
                          Reps mín.
                          <Input
                            className="mt-1"
                            type="number"
                            defaultValue={row.repMin}
                            onBlur={(e) => void saveRow(row, { repMin: Number(e.target.value) || 0 })}
                          />
                        </label>
                        <label className="text-sm text-muted">
                          Reps máx.
                          <Input
                            className="mt-1"
                            type="number"
                            defaultValue={row.repMax}
                            onBlur={(e) => void saveRow(row, { repMax: Number(e.target.value) || 0 })}
                          />
                        </label>
                      </div>
                      <label className="block text-sm text-muted">
                        Descanso (segundos)
                        <Input
                          className="mt-1"
                          type="number"
                          defaultValue={row.restSeconds}
                          onBlur={(e) => void saveRow(row, { restSeconds: Number(e.target.value) || 0 })}
                        />
                      </label>
                      <label className="block text-sm text-muted">
                        Vídeo do YouTube
                        <Input
                          className="mt-1"
                          defaultValue={exercise.youtubeUrl}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== exercise.youtubeUrl) {
                              void saveExercise(row, exercise, { youtubeUrl: e.target.value.trim() })
                            }
                          }}
                        />
                      </label>
                      <label className="block text-sm text-muted">
                        URL da foto
                        <Input
                          className="mt-1"
                          defaultValue={exercise.imageUrl ?? ''}
                          placeholder="Deixe vazio para usar a foto padrão"
                          onBlur={(e) => {
                            const next = e.target.value.trim()
                            if (next !== (exercise.imageUrl ?? '')) {
                              void saveExercise(row, exercise, { imageUrl: next })
                            }
                          }}
                        />
                      </label>
                      <label className="block text-sm text-muted">
                        Observações
                        <Textarea
                          className="mt-1"
                          defaultValue={row.notes}
                          onBlur={(e) => {
                            if (e.target.value !== row.notes) void saveRow(row, { notes: e.target.value })
                          }}
                        />
                      </label>
                      <div>
                        <p className="text-sm text-muted">Exercícios substitutos</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {catalog
                            .filter((item) => item.id !== exercise.id)
                            .slice(0, 20)
                            .map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => void toggleAlts(row, exercise, item.id)}
                                className={
                                  exercise.alternativeIds.includes(item.id)
                                    ? 'rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[#08090B]'
                                    : 'rounded-full bg-card2 px-3 py-1 text-xs text-muted'
                                }
                              >
                                {item.name}
                              </button>
                            ))}
                        </div>
                      </div>
                      <Button variant="danger" className="w-full" onClick={() => setRemoveRow(row)}>
                        Remover exercício
                      </Button>
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeRow)}
        title="Remover exercício?"
        message={HISTORY_WARNING}
        confirmLabel="Remover"
        danger
        onCancel={() => setRemoveRow(null)}
        onConfirm={() => void confirmRemove()}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar exercício">
        <p className="text-sm text-muted">Escolha um exercício existente ou cadastre um novo.</p>
        {unused.length > 0 ? (
          <>
            <Select className="mt-3" value={pickId} onChange={(e) => setPickId(e.target.value)}>
              <option value="">Selecionar da lista</option>
              {unused.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button className="mt-3 w-full" disabled={!pickId} onClick={() => void addExisting()}>
              Adicionar selecionado
            </Button>
          </>
        ) : null}
        <p className="mt-5 text-sm font-semibold">Novo exercício</p>
        <Input className="mt-2" placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Select value={newMuscle} onChange={(e) => setNewMuscle(e.target.value as typeof newMuscle)}>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {MUSCLE_LABELS[group]}
              </option>
            ))}
          </Select>
          <Select value={newEquip} onChange={(e) => setNewEquip(e.target.value as typeof newEquip)}>
            {EQUIPMENT.map((item) => (
              <option key={item} value={item}>
                {EQUIPMENT_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
        <Button className="mt-3 w-full" disabled={!newName.trim()} onClick={() => void addNew()}>
          Criar e adicionar
        </Button>
      </Modal>
    </AppShell>
  )
}
