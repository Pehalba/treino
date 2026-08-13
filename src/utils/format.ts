export function formatKg(value: number): string {
  return `${formatNumber(value)} kg`
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  }).format(value)
}

export function formatKcal(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')} kcal`
}

export function formatGrams(value: number): string {
  return `${formatNumber(value, 0)} g`
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`
}

export function parseLocaleNumber(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function parseHeightCm(input: string): number | null {
  const n = parseLocaleNumber(input)
  if (n == null || n <= 0) return null
  const cm = n < 3 ? n * 100 : n
  if (cm < 80 || cm > 250) return null
  return Math.round(cm)
}
