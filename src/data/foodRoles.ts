export const FOOD_ROLES = ['protein_anchor', 'carb_adjust', 'fat_adjust', 'free_vegetable'] as const
export type FoodRole = (typeof FOOD_ROLES)[number]

function normalizeFood(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const RULES: Array<{ test: string; role: FoodRole; protected?: boolean }> = [
  { test: 'peito de frango', role: 'protein_anchor' },
  { test: 'patinho', role: 'protein_anchor' },
  { test: 'iogurte', role: 'protein_anchor' },
  { test: 'ovo', role: 'protein_anchor' },
  { test: 'arroz', role: 'carb_adjust' },
  { test: 'macarrao', role: 'carb_adjust' },
  { test: 'aveia', role: 'carb_adjust' },
  { test: 'banana', role: 'carb_adjust' },
  { test: 'tapioca', role: 'carb_adjust' },
  { test: 'pao', role: 'carb_adjust' },
  { test: 'mel', role: 'carb_adjust' },
  { test: 'feijao', role: 'carb_adjust', protected: true },
  { test: 'azeite', role: 'fat_adjust' },
  { test: 'queijo', role: 'fat_adjust' },
  { test: 'leite', role: 'fat_adjust' },
  { test: 'molho de tomate', role: 'free_vegetable' },
  { test: 'tomate', role: 'free_vegetable' },
]

export function foodRole(name: string): FoodRole {
  const key = normalizeFood(name)
  const hit = RULES.find((rule) => key.includes(rule.test))
  if (hit) return hit.role
  return 'carb_adjust'
}

export function isProtectedFood(name: string): boolean {
  const key = normalizeFood(name)
  return RULES.some((rule) => rule.protected && key.includes(rule.test))
}

export const CARB_ADD_ORDER = ['arroz', 'macarrao', 'aveia', 'tapioca', 'pao', 'banana', 'mel', 'feijao']
export const CARB_REMOVE_ORDER = ['mel', 'banana', 'pao', 'tapioca', 'aveia', 'macarrao', 'arroz', 'feijao']

export function carbPriorityIndex(name: string, direction: 'add' | 'remove'): number {
  const key = normalizeFood(name)
  const list = direction === 'add' ? CARB_ADD_ORDER : CARB_REMOVE_ORDER
  const index = list.findIndex((token) => key.includes(token))
  return index === -1 ? list.length : index
}
