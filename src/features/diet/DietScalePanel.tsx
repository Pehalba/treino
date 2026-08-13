import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { dietEditorService } from '@/services/dietEditorService'
import { profileService } from '@/services/profileService'
import type { DietPlan, Profile } from '@/types'
import { mealMacroTotals } from '@/utils/dietMeals'
import { scaleDiet, type MealWithItems } from '@/utils/dietScale'
import { calcLayerA, macrosFromCalories } from '@/utils/dietTargets'
import { formatGrams, formatKcal } from '@/utils/format'
import { useMemo, useState } from 'react'

export function DietScalePanel({
  profile,
  userId,
  plan,
  meals,
  weightKg,
  onApplied,
}: {
  profile: Profile
  userId: string
  plan: DietPlan | null
  meals: MealWithItems[]
  weightKg: number | null
  onApplied: (meals: MealWithItems[]) => void
}) {
  const dietTotals = useMemo(() => mealMacroTotals(meals.flatMap((meal) => meal.items)), [meals])
  const layerA = calcLayerA({ profile, weightKg, dietKcal: dietTotals.calories })
  const suggested = 'error' in layerA ? null : layerA
  const [targetKcal, setTargetKcal] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof scaleDiet> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const resolvedTarget = Number(targetKcal) || suggested?.suggestedCalories || profile.calorieGoal

  function buildPreview() {
    setError('')
    if (!weightKg || weightKg <= 0) {
      setError('Cadastre o peso atual no perfil para calcular a meta.')
      return
    }
    if (meals.flatMap((meal) => meal.items).length === 0) {
      setError('Monte os pratos antes de recalcular as porções.')
      return
    }
    const macros = macrosFromCalories({
      calories: resolvedTarget,
      weightKg,
      goal: profile.goal ?? 'bulking',
    })
    const result = scaleDiet({ meals, targetKcal: macros.calories, targetProtein: Math.max(macros.protein, dietTotals.protein) })
    setPreview(result)
    setConfirmOpen(true)
  }

  async function apply() {
    if (!preview) return
    setSaving(true)
    try {
      const items = preview.meals.flatMap((meal) => meal.items)
      await dietEditorService.applyScaledItems(items, userId)
      await profileService.updateProfile(
        profile.id,
        {
          calorieGoal: Math.round(preview.after.calories),
          proteinGoal: Math.round(preview.after.protein),
          carbGoal: Math.round(preview.after.carbs),
          fatGoal: Math.round(preview.after.fat),
        },
        userId,
      )
      if (plan) {
        await dietEditorService.updatePlan(plan.id, { calorieGoal: Math.round(preview.after.calories) }, userId)
      }
      onApplied(preview.meals)
      setConfirmOpen(false)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar o ajuste.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-4">
      <h2 className="font-display text-lg">Ajustar porções</h2>
      <p className="mt-1 text-sm text-muted">
        A meta vem da altura, peso e objetivo. Os pratos continuam os mesmos — só mudam as quantidades. Alimento
        marcado como manual não é mexido.
      </p>
      {'error' in layerA ? (
        <p className="mt-3 text-sm text-danger">{layerA.error}</p>
      ) : (
        <div className="mt-3 space-y-1 text-sm">
          <p>TDEE estimado: {formatKcal(layerA.tdee)}</p>
          <p>
            Faixa {profile.goal === 'cutting' ? 'cutting' : profile.goal === 'maintain' ? 'manutenção' : 'bulking'}:{' '}
            {formatKcal(layerA.calorieRange[0])} – {formatKcal(layerA.calorieRange[1])}
          </p>
          <p>Sugestão: {formatKcal(layerA.suggestedCalories)}</p>
          <p>Dieta atual: {formatKcal(dietTotals.calories)}</p>
          {layerA.warnings.map((warning) => (
            <p key={warning} className="text-warn">
              {warning}
            </p>
          ))}
        </div>
      )}
      <label className="mt-3 block text-sm text-muted">
        Meta de kcal para hoje
        <Input
          className="mt-1"
          type="number"
          value={targetKcal}
          placeholder={String(suggested?.suggestedCalories ?? profile.calorieGoal)}
          onChange={(e) => setTargetKcal(e.target.value)}
        />
      </label>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <Button className="mt-3 w-full" variant="secondary" onClick={buildPreview} disabled={!suggested}>
        Ver novas porções
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Aplicar novas porções?"
        message={
          preview
            ? `${preview.largeChange ? 'Mudança grande. ' : ''}De ${formatKcal(preview.before.calories)} para ${formatKcal(preview.after.calories)} · prot ${formatGrams(preview.after.protein)} · carbo ${formatGrams(preview.after.carbs)} · gord ${formatGrams(preview.after.fat)}.${preview.warnings.length ? ` ${preview.warnings[0]}` : ''} O que você já registrou em calorias em dias anteriores não muda.`
            : ''
        }
        confirmLabel={saving ? 'Aplicando…' : 'Aplicar'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void apply()}
      />
    </Card>
  )
}
