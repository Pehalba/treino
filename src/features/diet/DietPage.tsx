import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EditButton } from '@/components/ui/EditButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { VideoModal } from '@/features/workout/WorkoutPieces'
import { useSession } from '@/hooks/useSession'
import { dietService } from '@/services/nutritionService'
import {
  DIET_SUPPLEMENT_KINDS,
  DIET_SUPPLEMENT_LABELS,
  MEAL_LABELS,
  type DietMeal,
  type DietMealItem,
  type DietSupplement,
  type DietSupplementKind,
} from '@/types'
import { loadDietCache } from '@/utils/dietCache'
import { loadSupplementCache } from '@/utils/supplementCache'
import { cn } from '@/utils/cn'
import { groupMealsByMenuCategory, mealMacroTotals, type DietMenuCategory } from '@/utils/dietMeals'
import { formatGrams, formatKcal, parseLocaleNumber } from '@/utils/format'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type MealWithItems = DietMeal & { items: DietMealItem[] }

const SHORT_MEAL_LABELS: Record<DietMenuCategory, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Tarde',
  dinner: 'Jantar',
  supper: 'Ceia',
  other: 'Extra',
}

const DEFAULT_NAMES: Record<DietSupplementKind, string> = {
  protein: 'Whey protein',
  hypercaloric: 'Hipercalórico',
}

export function DietPage() {
  const { user, activeProfile } = useSession()
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [planName, setPlanName] = useState('Minha dieta')
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<DietMenuCategory>('breakfast')
  const [videoMeal, setVideoMeal] = useState<MealWithItems | null>(null)
  const [supplements, setSupplements] = useState<DietSupplement[]>([])
  const [editingKind, setEditingKind] = useState<DietSupplementKind | null>(null)
  const [savingSupplement, setSavingSupplement] = useState(false)
  const [supplementError, setSupplementError] = useState('')
  const [formName, setFormName] = useState('')
  const [formDoses, setFormDoses] = useState('1')
  const [formCalories, setFormCalories] = useState('')
  const [formProtein, setFormProtein] = useState('')
  const [formCarbs, setFormCarbs] = useState('')
  const [formFat, setFormFat] = useState('')

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    const cached = loadDietCache(activeProfile.id)
    if (cached?.plan) {
      setPlanName(cached.plan.name)
      setMeals(cached.meals)
      setLoading(false)
    } else {
      setPlanName('Minha dieta')
      setMeals([])
      setLoading(true)
    }
    const cachedSupplements = loadSupplementCache(activeProfile.id)
    if (cachedSupplements) setSupplements(cachedSupplements)

    dietService.getActivePlan(activeProfile).then((data) => {
      if (!alive) return
      setPlanName(data.plan?.name ?? 'Minha dieta')
      setMeals(data.meals)
      setLoading(false)
    })
    dietService.listSupplements(activeProfile.id).then((items) => {
      if (!alive) return
      setSupplements(items)
    })
    return () => {
      alive = false
    }
  }, [activeProfile?.id])

  const sections = useMemo(() => groupMealsByMenuCategory(meals), [meals])
  const current = sections.find((section) => section.category === category) ?? sections[0]
  const dishes = current?.meals ?? []

  const supplementCards = useMemo(() => {
    return DIET_SUPPLEMENT_KINDS.map((kind) => {
      const item = supplements.find((row) => row.kind === kind) ?? null
      return { kind, item }
    })
  }, [supplements])

  const supplementDayTotals = useMemo(() => {
    return supplements.reduce(
      (acc, item) => {
        const doses = item.dosesPerDay || 0
        return {
          calories: acc.calories + doses * (item.caloriesPerDose || 0),
          protein: acc.protein + doses * (item.proteinPerDose || 0),
        }
      },
      { calories: 0, protein: 0 },
    )
  }, [supplements])

  useEffect(() => {
    if (!current || current.meals.length > 0) return
    const first = sections.find((section) => section.meals.length > 0)
    if (first) setCategory(first.category)
  }, [current, sections])

  function openSupplementEditor(kind: DietSupplementKind) {
    const item = supplements.find((row) => row.kind === kind)
    setEditingKind(kind)
    setSupplementError('')
    setFormName(item?.name || DEFAULT_NAMES[kind])
    setFormDoses(String(item?.dosesPerDay ?? 1))
    setFormCalories(item ? String(item.caloriesPerDose) : '')
    setFormProtein(item ? String(item.proteinPerDose) : '')
    setFormCarbs(item && item.carbsPerDose ? String(item.carbsPerDose) : '')
    setFormFat(item && item.fatPerDose ? String(item.fatPerDose) : '')
  }

  async function saveSupplement() {
    if (!user || !activeProfile || !editingKind) return
    const doses = parseLocaleNumber(formDoses)
    const calories = parseLocaleNumber(formCalories)
    const protein = parseLocaleNumber(formProtein)
    const carbs = parseLocaleNumber(formCarbs) ?? 0
    const fat = parseLocaleNumber(formFat) ?? 0
    if (doses == null || doses < 0) {
      setSupplementError('Informe quantas doses você toma por dia.')
      return
    }
    if (calories == null || calories < 0) {
      setSupplementError('Informe as calorias por dose.')
      return
    }
    if (protein == null || protein < 0) {
      setSupplementError('Informe a proteína por dose.')
      return
    }
    setSavingSupplement(true)
    setSupplementError('')
    try {
      const existing = supplements.find((row) => row.kind === editingKind)
      const saved = await dietService.saveSupplement({
        profile: activeProfile,
        userId: user.id,
        kind: editingKind,
        existingId: existing?.id,
        name: formName,
        dosesPerDay: doses,
        caloriesPerDose: calories,
        proteinPerDose: protein,
        carbsPerDose: carbs,
        fatPerDose: fat,
      })
      setSupplements((prev) => {
        const without = prev.filter((row) => row.kind !== editingKind && row.id !== saved.id)
        return [...without, saved]
      })
      setEditingKind(null)
    } catch (err) {
      setSupplementError(err instanceof Error ? err.message : 'Não foi possível salvar o suplemento.')
    } finally {
      setSavingSupplement(false)
    }
  }

  return (
    <AppShell title="Dietas">
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl leading-tight">{planName}</h2>
              <p className="mt-1 text-sm text-muted">Escolha a refeição e veja as opções.</p>
            </div>
            <EditButton to="/dietas/editar" />
          </div>

          <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
            {sections.map((section) => {
              const selected = section.category === category
              return (
                <button
                  key={section.category}
                  type="button"
                  onClick={() => setCategory(section.category)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    selected ? 'bg-accent text-bg' : 'bg-card2 text-muted',
                  )}
                >
                  {SHORT_MEAL_LABELS[section.category]}
                </button>
              )
            })}
          </div>

          <div className="mb-4 flex items-end justify-between gap-3">
            <h3 className="font-display text-xl">{current ? MEAL_LABELS[current.category] : 'Refeição'}</h3>
            <p className="text-sm text-muted">
              {dishes.length === 0
                ? 'Sem opções ainda'
                : `${dishes.length} ${dishes.length === 1 ? 'opção' : 'opções'}`}
            </p>
          </div>

          {dishes.length === 0 ? (
            <Card className="border border-dashed border-line bg-transparent">
              <p className="text-sm text-muted">Nenhum prato nesta refeição ainda.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {dishes.map((meal) => {
                const totals = mealMacroTotals(meal.items)
                return (
                  <article key={meal.id} className="overflow-hidden rounded-3xl bg-card">
                    <div className="flex items-start justify-between gap-3 px-4 pt-4">
                      <h4 className="font-display text-xl leading-tight">{meal.name || current?.label}</h4>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-2xl leading-none text-accent">{Math.round(totals.calories)}</p>
                        <p className="mt-0.5 text-[11px] tracking-wide text-muted uppercase">kcal</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 px-4">
                      <MacroChip label="Prot" value={formatGrams(totals.protein)} />
                      <MacroChip label="Carbo" value={formatGrams(totals.carbs)} />
                      <MacroChip label="Gord" value={formatGrams(totals.fat)} />
                    </div>
                    {meal.items.length === 0 ? (
                      <p className="px-4 pt-3 pb-4 text-sm text-muted">Ainda sem alimentos neste prato.</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-line/80">
                        {meal.items.map((item) => (
                          <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium">{item.foodName}</p>
                              {item.quantityLabel ? <p className="mt-0.5 text-sm text-muted">{item.quantityLabel}</p> : null}
                            </div>
                            <p className="shrink-0 text-sm text-muted">{formatKcal(item.calories)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {meal.youtubeUrl ? (
                      <div className="px-4 pt-1 pb-4">
                        <Button className="w-full" variant="secondary" onClick={() => setVideoMeal(meal)}>
                          Como preparar
                        </Button>
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </article>
                )
              })}
            </div>
          )}

          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-xl">Suplementação</h3>
                <p className="mt-1 text-sm text-muted">Doses do dia com calorias e proteína.</p>
              </div>
              {supplementDayTotals.calories > 0 || supplementDayTotals.protein > 0 ? (
                <p className="shrink-0 text-right text-sm text-muted">
                  Total{' '}
                  <span className="font-semibold text-ink">
                    {formatKcal(supplementDayTotals.calories)} · {formatGrams(supplementDayTotals.protein)}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {supplementCards.map(({ kind, item }) => {
                const doses = item?.dosesPerDay ?? 0
                const dayCalories = doses * (item?.caloriesPerDose ?? 0)
                const dayProtein = doses * (item?.proteinPerDose ?? 0)
                const configured = Boolean(item && (item.dosesPerDay > 0 || item.caloriesPerDose > 0 || item.proteinPerDose > 0))
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => openSupplementEditor(kind)}
                    className="w-full rounded-3xl bg-card p-4 text-left transition active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                          {DIET_SUPPLEMENT_LABELS[kind]}
                        </p>
                        <p className="mt-1 font-display text-xl leading-tight">
                          {item?.name || DEFAULT_NAMES[kind]}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-card2 px-3 py-1 text-xs font-semibold text-accent">
                        Editar
                      </span>
                    </div>
                    {configured ? (
                      <>
                        <p className="mt-3 text-sm text-muted">
                          {doses} {doses === 1 ? 'dose' : 'doses'}/dia ·{' '}
                          {formatKcal(item?.caloriesPerDose ?? 0)} e {formatGrams(item?.proteinPerDose ?? 0)} por dose
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <MacroChip label="Dia" value={formatKcal(dayCalories)} />
                          <MacroChip label="Prot/dia" value={formatGrams(dayProtein)} />
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted">Toque para informar doses, calorias e proteína.</p>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <Link
            to="/calorias"
            className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-bg"
          >
            Registrar em Calorias
          </Link>
        </>
      )}
      <VideoModal
        title="Como preparar"
        url={videoMeal?.youtubeUrl ?? ''}
        open={Boolean(videoMeal)}
        onClose={() => setVideoMeal(null)}
      />
      <Modal
        open={Boolean(editingKind)}
        onClose={() => !savingSupplement && setEditingKind(null)}
        title={editingKind ? `Suplemento · ${DIET_SUPPLEMENT_LABELS[editingKind]}` : 'Suplemento'}
      >
        <div className="space-y-3">
          <label className="block text-sm text-muted">
            Nome
            <Input className="mt-1" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex.: Whey Growth" />
          </label>
          <label className="block text-sm text-muted">
            Doses por dia
            <Input className="mt-1" inputMode="decimal" value={formDoses} onChange={(e) => setFormDoses(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-muted">
              Kcal por dose
              <Input className="mt-1" inputMode="decimal" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Proteína (g)
              <Input className="mt-1" inputMode="decimal" value={formProtein} onChange={(e) => setFormProtein(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Carbo (g)
              <Input className="mt-1" inputMode="decimal" value={formCarbs} onChange={(e) => setFormCarbs(e.target.value)} />
            </label>
            <label className="block text-sm text-muted">
              Gordura (g)
              <Input className="mt-1" inputMode="decimal" value={formFat} onChange={(e) => setFormFat(e.target.value)} />
            </label>
          </div>
          {supplementError ? <p className="text-sm text-danger">{supplementError}</p> : null}
          <Button className="w-full" size="xl" onClick={() => void saveSupplement()} disabled={savingSupplement}>
            {savingSupplement ? 'Salvando…' : 'Salvar suplemento'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-card2 px-3 py-1 text-xs font-medium text-muted">
      <span className="text-ink">{label}</span> {value}
    </span>
  )
}
