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
import { dietEditorService } from '@/services/dietEditorService'
import { dietService } from '@/services/nutritionService'
import {
  MEAL_CATEGORIES,
  MEAL_LABELS,
  type DietMeal,
  type DietMealItem,
  type DietPlan,
  type MealCategory,
} from '@/types'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [addMealOpen, setAddMealOpen] = useState(false)
  const [mealName, setMealName] = useState('')
  const [mealCategory, setMealCategory] = useState<MealCategory>('lunch')
  const [addFoodMeal, setAddFoodMeal] = useState<MealWithItems | null>(null)
  const [foodName, setFoodName] = useState('')
  const [qty, setQty] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  async function load() {
    if (!activeProfile || !user) return
    setLoading(true)
    const data = await dietService.getActivePlan(activeProfile.id)
    let current = data.plan
    if (!current) {
      current = await dietEditorService.createEmptyPlan({ profile: activeProfile, userId: user.id })
    }
    setPlan(current)
    setMeals(data.meals)
    setName(current.name)
    setCalorieGoal(current.calorieGoal ? String(current.calorieGoal) : '')
    setNotes(current.notes ?? '')
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

  async function saveMeal(meal: DietMeal, data: Partial<Pick<DietMeal, 'name' | 'category' | 'notes'>>) {
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

  async function moveMeal(index: number, dir: -1 | 1) {
    if (!user) return
    const next = index + dir
    if (next < 0 || next >= meals.length) return
    const copy = [...meals]
    const current = copy[index]
    const swap = copy[next]
    if (!current || !swap) return
    copy[index] = swap
    copy[next] = current
    setMeals(copy)
    await dietEditorService.reorderMeals(copy, user.id)
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

  async function createMeal() {
    if (!user || !activeProfile || !plan) return
    const meal = await dietEditorService.addMeal({
      profile: activeProfile,
      plan,
      userId: user.id,
      name: mealName,
      category: mealCategory,
      order: meals.length,
    })
    setMeals([...meals, { ...meal, items: [] }])
    setAddMealOpen(false)
    setMealName('')
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

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-lg">Refeições</h2>
            <Button size="md" variant="secondary" onClick={() => setAddMealOpen(true)} disabled={!plan}>
              <Plus size={16} /> Adicionar
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {meals.map((meal, index) => (
              <Card key={meal.id}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}>
                    <p className="font-display text-lg">{meal.name || MEAL_LABELS[meal.category]}</p>
                    <p className="text-sm text-muted">{meal.items.length} alimentos</p>
                  </button>
                  <div className="flex gap-1">
                    <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => void moveMeal(index, -1)}>
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" className="rounded-xl bg-card2 p-2" onClick={() => void moveMeal(index, 1)}>
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
                {expanded === meal.id ? (
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm text-muted">
                      Nome da refeição
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
                        value={meal.category}
                        onChange={(e) => void saveMeal(meal, { category: e.target.value as MealCategory })}
                      >
                        {MEAL_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {MEAL_LABELS[category]}
                          </option>
                        ))}
                      </Select>
                    </label>
                    {meal.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-card2 p-3">
                        <Input
                          defaultValue={item.foodName}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== item.foodName) void saveItem(item, { foodName: e.target.value })
                          }}
                        />
                        <Input
                          className="mt-2"
                          placeholder="Quantidade"
                          defaultValue={item.quantityLabel}
                          onBlur={(e) => {
                            if (e.target.value !== item.quantityLabel) void saveItem(item, { quantityLabel: e.target.value })
                          }}
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Input
                            type="number"
                            defaultValue={item.calories}
                            onBlur={(e) => void saveItem(item, { calories: Number(e.target.value) || 0 })}
                          />
                          <Input
                            type="number"
                            defaultValue={item.protein}
                            onBlur={(e) => void saveItem(item, { protein: Number(e.target.value) || 0 })}
                          />
                          <Input
                            type="number"
                            defaultValue={item.carbs}
                            onBlur={(e) => void saveItem(item, { carbs: Number(e.target.value) || 0 })}
                          />
                          <Input
                            type="number"
                            defaultValue={item.fat}
                            onBlur={(e) => void saveItem(item, { fat: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted">kcal · prot · carbo · gordura</p>
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
                      Excluir refeição
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeMeal)}
        title="Excluir refeição?"
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

      <Modal open={addMealOpen} onClose={() => setAddMealOpen(false)} title="Nova refeição">
        <Input placeholder="Nome" value={mealName} onChange={(e) => setMealName(e.target.value)} />
        <Select className="mt-3" value={mealCategory} onChange={(e) => setMealCategory(e.target.value as MealCategory)}>
          {MEAL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {MEAL_LABELS[category]}
            </option>
          ))}
        </Select>
        <Button className="mt-4 w-full" disabled={!mealName.trim()} onClick={() => void createMeal()}>
          Adicionar
        </Button>
      </Modal>

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
