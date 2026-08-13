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
import { DietScalePanel } from '@/features/diet/DietScalePanel'
import { dietEditorService } from '@/services/dietEditorService'
import { dietService } from '@/services/nutritionService'
import { weightService } from '@/services/weightService'
import {
  MEAL_CATEGORIES,
  MEAL_LABELS,
  type DietMeal,
  type DietMealItem,
  type DietPlan,
  type MealCategory,
} from '@/types'
import { groupMealsByMenuCategory, nextDishName, normalizeMealCategory } from '@/utils/dietMeals'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HISTORY_WARNING =
  'Essa alteração será aplicada à dieta atual. O que você já registrou em calorias em dias anteriores não muda.'

type MealWithItems = DietMeal & { items: DietMealItem[] }

export function DietEditPage() {
  const navigate = useNavigate()
  const { user, activeProfile } = useSession()
  const { message, show } = useFeedback()
  const [plan, setPlan] = useState<DietPlan | null>(null)
  const [meals, setMeals] = useState<MealWithItems[]>([])
  const [name, setName] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [removeMeal, setRemoveMeal] = useState<DietMeal | null>(null)
  const [removeItem, setRemoveItem] = useState<DietMealItem | null>(null)
  const [addFoodMeal, setAddFoodMeal] = useState<MealWithItems | null>(null)
  const [foodName, setFoodName] = useState('')
  const [qty, setQty] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [weightKg, setWeightKg] = useState<number | null>(null)

  async function load() {
    if (!activeProfile || !user) return
    setLoading(true)
    const data = await dietService.getActivePlan(activeProfile)
    let current = data.plan
    if (!current) {
      current = await dietEditorService.createEmptyPlan({ profile: activeProfile, userId: user.id })
    }
    setPlan(current)
    setMeals(data.meals)
    setName(current.name)
    setCalorieGoal(current.calorieGoal ? String(current.calorieGoal) : '')
    setNotes(current.notes ?? '')
    const weights = await weightService.list(activeProfile.id)
    setWeightKg(weights[0]?.weight ?? null)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [activeProfile?.id, user?.id])

  async function savePlan() {
    if (!user || !activeProfile) return
    try {
      let current = plan
      if (!current) {
        current = await dietEditorService.createEmptyPlan({ profile: activeProfile, userId: user.id, name })
        setPlan(current)
      }
      await dietEditorService.updatePlan(
        current.id,
        {
          name,
          calorieGoal: calorieGoal ? Number(calorieGoal) : null,
          notes,
        },
        user.id,
      )
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    }
  }

  async function saveMeal(meal: DietMeal, data: Partial<Pick<DietMeal, 'name' | 'category' | 'notes' | 'youtubeUrl'>>) {
    if (!user) return
    await dietEditorService.updateMeal(meal.id, data, user.id)
    setMeals((items) => items.map((item) => (item.id === meal.id ? { ...item, ...data } : item)))
    show()
  }

  async function saveItem(item: DietMealItem, data: Partial<DietMealItem>) {
    if (!user) return
    try {
      await dietEditorService.updateItem(item.id, data, user.id)
      setMeals((meals) =>
        meals.map((meal) => ({
          ...meal,
          items: meal.items.map((row) => (row.id === item.id ? { ...row, ...data } : row)),
        })),
      )
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o alimento.')
    }
  }

  const sections = useMemo(() => groupMealsByMenuCategory(meals), [meals])

  async function moveMeal(mealId: string, dir: -1 | 1) {
    if (!user) return
    const grouped = groupMealsByMenuCategory(meals)
    const nextGroups = grouped.map((section) => {
      const index = section.meals.findIndex((item) => item.id === mealId)
      if (index < 0) return section.meals
      const swap = index + dir
      if (swap < 0 || swap >= section.meals.length) return section.meals
      const copy = [...section.meals]
      const current = copy[index]
      const other = copy[swap]
      if (!current || !other) return section.meals
      copy[index] = other
      copy[swap] = current
      return copy
    })
    const ordered = nextGroups.flat()
    setMeals(ordered)
    await dietEditorService.reorderMeals(ordered, user.id)
    show()
  }

  async function confirmRemoveMeal() {
    if (!user || !removeMeal) return
    await dietEditorService.archiveMeal(removeMeal.id, user.id)
    setMeals((items) => items.filter((item) => item.id !== removeMeal.id))
    setRemoveMeal(null)
    show()
  }

  async function confirmRemoveItem() {
    if (!user || !removeItem) return
    await dietEditorService.archiveItem(removeItem.id, user.id)
    setMeals((items) =>
      items.map((meal) => ({ ...meal, items: meal.items.filter((item) => item.id !== removeItem.id) })),
    )
    setRemoveItem(null)
    show()
  }

  async function createMeal(category: MealCategory) {
    if (!user || !activeProfile || !plan) return
    const existing = meals.filter((meal) => normalizeMealCategory(meal.category) === category).length
    const meal = await dietEditorService.addMeal({
      profile: activeProfile,
      plan,
      userId: user.id,
      name: nextDishName(category, existing),
      category,
      order: meals.length,
    })
    setMeals([...meals, { ...meal, items: [] }])
    setExpanded(meal.id)
    show()
  }

  async function createFood() {
    if (!user || !activeProfile || !addFoodMeal) return
    const item = await dietEditorService.addItem({
      profile: activeProfile,
      meal: addFoodMeal,
      userId: user.id,
      order: addFoodMeal.items.length,
      foodName,
      calories: Number(kcal) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      quantityLabel: qty,
    })
    setMeals((items) =>
      items.map((meal) => (meal.id === addFoodMeal.id ? { ...meal, items: [...meal.items, item] } : meal)),
    )
    setAddFoodMeal(null)
    setFoodName('')
    setQty('')
    setKcal('')
    setProtein('')
    setCarbs('')
    setFat('')
    show()
  }

  return (
    <AppShell title="Editar dieta">
      <Toast message={message} />
      <Button variant="ghost" className="mb-4 px-0" onClick={() => navigate(-1)}>
        ← Voltar
      </Button>
      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{HISTORY_WARNING}</p>
          {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
          <Card>
            <label className="text-sm text-muted">
              Nome da dieta
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="mt-3 block text-sm text-muted">
              Meta calórica
              <Input className="mt-1" type="number" value={calorieGoal} onChange={(e) => setCalorieGoal(e.target.value)} />
            </label>
            <label className="mt-3 block text-sm text-muted">
              Observações
              <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <Button className="mt-3 w-full" onClick={() => void savePlan()}>
              Salvar dieta
            </Button>
          </Card>

          {user && activeProfile ? (
            <DietScalePanel
              profile={activeProfile}
              userId={user.id}
              plan={plan}
              meals={meals}
              weightKg={weightKg}
              onApplied={(next) => {
                setMeals(next)
                show('Porções atualizadas ✓')
              }}
            />
          ) : null}

          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section key={section.category}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">{section.label}</h2>
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => void createMeal(section.category)}
                    disabled={!plan}
                  >
                    <Plus size={16} /> Prato
                  </Button>
                </div>
                {section.meals.length === 0 ? (
                  <Card className="border border-dashed border-line bg-transparent">
                    <p className="text-sm text-muted">Nenhum prato ainda.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {section.meals.map((meal, index) => (
                      <Card key={meal.id}>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                          >
                            <p className="font-display text-lg">{meal.name || section.label}</p>
                            <p className="text-sm text-muted">
                              {meal.items.length === 0 ? 'Sem alimentos' : `${meal.items.length} alimentos`}
                            </p>
                          </button>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="rounded-xl bg-card2 p-2"
                              disabled={index === 0}
                              onClick={() => void moveMeal(meal.id, -1)}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="rounded-xl bg-card2 p-2"
                              disabled={index === section.meals.length - 1}
                              onClick={() => void moveMeal(meal.id, 1)}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        </div>
                        {expanded === meal.id ? (
                          <div className="mt-4 space-y-3">
                            <label className="block text-sm text-muted">
                              Nome do prato
                              <Input
                                className="mt-1"
                                defaultValue={meal.name}
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== meal.name) void saveMeal(meal, { name: e.target.value })
                                }}
                              />
                            </label>
                            <label className="block text-sm text-muted">
                              Categoria
                              <Select
                                className="mt-1"
                                value={normalizeMealCategory(meal.category)}
                                onChange={(e) => void saveMeal(meal, { category: e.target.value as MealCategory })}
                              >
                                {MEAL_CATEGORIES.map((category) => (
                                  <option key={category} value={category}>
                                    {MEAL_LABELS[category]}
                                  </option>
                                ))}
                              </Select>
                            </label>
                            <label className="block text-sm text-muted">
                              Vídeo de como preparar (YouTube)
                              <Input
                                className="mt-1"
                                placeholder="https://www.youtube.com/watch?v=..."
                                defaultValue={meal.youtubeUrl ?? ''}
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== (meal.youtubeUrl ?? '')) {
                                    void saveMeal(meal, { youtubeUrl: e.target.value.trim() })
                                  }
                                }}
                              />
                            </label>
                            {meal.items.map((item) => (
                              <div key={item.id} className="rounded-2xl bg-card2 p-3">
                                <Input
                                  defaultValue={item.foodName}
                                  onBlur={(e) => {
                                    if (e.target.value.trim() !== item.foodName) {
                                      void saveItem(item, { foodName: e.target.value, manualOverride: true })
                                    }
                                  }}
                                />
                                <Input
                                  className="mt-2"
                                  placeholder="Quantidade"
                                  defaultValue={item.quantityLabel}
                                  onBlur={(e) => {
                                    if (e.target.value !== item.quantityLabel) {
                                      void saveItem(item, { quantityLabel: e.target.value, manualOverride: true })
                                    }
                                  }}
                                />
                                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <Input
                                    type="number"
                                    defaultValue={item.calories}
                                    onBlur={(e) => {
                                      const calories = Number(e.target.value) || 0
                                      if (calories !== item.calories) void saveItem(item, { calories, manualOverride: true })
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    defaultValue={item.protein}
                                    onBlur={(e) => {
                                      const protein = Number(e.target.value) || 0
                                      if (protein !== item.protein) void saveItem(item, { protein, manualOverride: true })
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    defaultValue={item.carbs}
                                    onBlur={(e) => {
                                      const carbs = Number(e.target.value) || 0
                                      if (carbs !== item.carbs) void saveItem(item, { carbs, manualOverride: true })
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    defaultValue={item.fat}
                                    onBlur={(e) => {
                                      const fat = Number(e.target.value) || 0
                                      if (fat !== item.fat) void saveItem(item, { fat, manualOverride: true })
                                    }}
                                  />
                                </div>
                                <p className="mt-1 text-[11px] text-muted">kcal · prot · carbo · gordura</p>
                                <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.manualOverride)}
                                    onChange={(e) => void saveItem(item, { manualOverride: e.target.checked })}
                                  />
                                  Não recalcular este alimento
                                </label>
                                <Input
                                  className="mt-2"
                                  placeholder="Observações"
                                  defaultValue={item.notes ?? ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (item.notes ?? '')) void saveItem(item, { notes: e.target.value })
                                  }}
                                />
                                <Input
                                  className="mt-2"
                                  placeholder="Substituições (texto livre)"
                                  defaultValue={(item.substitutes ?? []).map((row) => row.foodName).join(', ')}
                                  onBlur={(e) => {
                                    const substitutes = e.target.value
                                      .split(',')
                                      .map((name) => name.trim())
                                      .filter(Boolean)
                                      .map((foodName) => ({
                                        foodName,
                                        calories: 0,
                                        protein: 0,
                                        carbs: 0,
                                        fat: 0,
                                        quantityLabel: '',
                                      }))
                                    void saveItem(item, { substitutes })
                                  }}
                                />
                                <Button className="mt-2 w-full" size="md" variant="danger" onClick={() => setRemoveItem(item)}>
                                  Remover alimento
                                </Button>
                              </div>
                            ))}
                            <Button variant="secondary" className="w-full" onClick={() => setAddFoodMeal(meal)}>
                              Adicionar alimento
                            </Button>
                            <Button variant="danger" className="w-full" onClick={() => setRemoveMeal(meal)}>
                              Excluir prato
                            </Button>
                          </div>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeMeal)}
        title="Excluir prato?"
        message={HISTORY_WARNING}
        confirmLabel="Remover"
        danger
        onCancel={() => setRemoveMeal(null)}
        onConfirm={() => void confirmRemoveMeal()}
      />
      <ConfirmDialog
        open={Boolean(removeItem)}
        title="Remover alimento?"
        message={HISTORY_WARNING}
        confirmLabel="Remover"
        danger
        onCancel={() => setRemoveItem(null)}
        onConfirm={() => void confirmRemoveItem()}
      />

      <Modal open={Boolean(addFoodMeal)} onClose={() => setAddFoodMeal(null)} title="Novo alimento">
        <Input placeholder="Alimento" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
        <Input className="mt-2" placeholder="Quantidade" value={qty} onChange={(e) => setQty(e.target.value)} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input placeholder="kcal" type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          <Input placeholder="Proteína" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input placeholder="Carbo" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input placeholder="Gordura" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        <Button className="mt-4 w-full" disabled={!foodName.trim()} onClick={() => void createFood()}>
          Adicionar
        </Button>
      </Modal>
    </AppShell>
  )
}
