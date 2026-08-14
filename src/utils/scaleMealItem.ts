import type { DietMealItem } from '@/types'

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10
}

function formatScaledNumber(value: number): string {
  const rounded = Math.abs(value - Math.round(value)) < 0.05 ? Math.round(value) : Math.round(value * 2) / 2
  return String(rounded).replace('.', ',')
}

/** Escala números da quantidade (ex.: 1 unidade (50 g) × 3 → 3 unidades (150 g)). */
export function scaleQuantityLabel(label: string, factor: number): string {
  if (!label.trim() || factor === 1) return label
  let next = label.replace(/(\d+(?:[.,]\d+)?)/g, (raw) => {
    const value = Number(raw.replace(',', '.')) * factor
    if (!Number.isFinite(value)) return raw
    return formatScaledNumber(value)
  })
  next = next.replace(/(\d+(?:[.,]\d+)?)\s+unidades?\b/gi, (_, raw: string) => {
    const n = Number(String(raw).replace(',', '.'))
    return `${raw} ${n === 1 ? 'unidade' : 'unidades'}`
  })
  return next
}

export function scaleMealItemByFactor(item: DietMealItem, factor: number): DietMealItem {
  const safe = Math.max(0, factor)
  if (safe === 1) return item
  return {
    ...item,
    calories: roundMacro(item.calories * safe),
    protein: roundMacro(item.protein * safe),
    carbs: roundMacro(item.carbs * safe),
    fat: roundMacro(item.fat * safe),
    quantityLabel: scaleQuantityLabel(item.quantityLabel, safe),
    manualOverride: true,
  }
}
