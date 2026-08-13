/** Local exercise demo images (WebP in public/exercises). */
const KEY_TO_FILE: Record<string, string> = {
  'db-bench': 'db-bench',
  'bb-bench': 'bb-bench',
  'machine-chest': 'machine-chest',
  'incline-db': 'incline-db',
  fly: 'fly',
  'bent-over-row': 'bent-over-row',
  'seated-row': 'seated-row',
  'machine-row': 'machine-row',
  'chest-supported-row': 'chest-supported-row',
  'lat-pulldown': 'lat-pulldown',
  pullup: 'pullup',
  'db-shoulder-press': 'db-shoulder-press',
  'machine-shoulder': 'machine-shoulder',
  'lateral-raise': 'lateral-raise',
  'reverse-fly': 'reverse-fly',
  'bb-curl': 'bb-curl',
  'hammer-curl': 'hammer-curl',
  pushdown: 'pushdown',
  'skull-crusher': 'skull-crusher',
  squat: 'squat',
  'leg-press': 'leg-press',
  lunge: 'lunge',
  'leg-extension': 'leg-extension',
  rdl: 'rdl',
  stiff: 'stiff',
  'lying-curl': 'lying-curl',
  'seated-curl': 'seated-curl',
  'standing-calf': 'standing-calf',
  'seated-calf': 'seated-calf',
  crunch: 'crunch',
  plank: 'plank',
}

const NAME_TO_KEY: Record<string, string> = {
  'supino reto com halteres': 'db-bench',
  'supino reto com barra': 'bb-bench',
  'supino máquina': 'machine-chest',
  'supino maquina': 'machine-chest',
  'supino inclinado com halteres': 'incline-db',
  'crucifixo com halteres': 'fly',
  'remada curvada': 'bent-over-row',
  'remada baixa': 'seated-row',
  'remada máquina': 'machine-row',
  'remada maquina': 'machine-row',
  'remada articulada': 'chest-supported-row',
  'puxada frontal': 'lat-pulldown',
  'barra fixa': 'pullup',
  'desenvolvimento com halteres': 'db-shoulder-press',
  'desenvolvimento máquina': 'machine-shoulder',
  'desenvolvimento maquina': 'machine-shoulder',
  'elevação lateral': 'lateral-raise',
  'elevacao lateral': 'lateral-raise',
  'crucifixo inverso': 'reverse-fly',
  'rosca direta': 'bb-curl',
  'rosca martelo': 'hammer-curl',
  'tríceps pulley': 'pushdown',
  'triceps pulley': 'pushdown',
  'tríceps testa': 'skull-crusher',
  'triceps testa': 'skull-crusher',
  'agachamento livre': 'squat',
  'leg press': 'leg-press',
  avanço: 'lunge',
  avanco: 'lunge',
  'cadeira extensora': 'leg-extension',
  'levantamento terra romeno': 'rdl',
  stiff: 'stiff',
  'mesa flexora': 'lying-curl',
  'cadeira flexora': 'seated-curl',
  'panturrilha em pé': 'standing-calf',
  'panturrilha em pe': 'standing-calf',
  'panturrilha sentado': 'seated-calf',
  abdominal: 'crunch',
  prancha: 'plank',
}

function assetUrl(fileStem: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}exercises/${fileStem}.webp`
}

export function exerciseImageByKey(key: string): string | undefined {
  const stem = KEY_TO_FILE[key]
  return stem ? assetUrl(stem) : undefined
}

export function resolveExerciseImage(params: {
  name?: string | null
  imageUrl?: string | null
  key?: string | null
}): string | undefined {
  const custom = params.imageUrl?.trim()
  if (custom) return custom
  if (params.key) {
    const byKey = exerciseImageByKey(params.key)
    if (byKey) return byKey
  }
  const name = params.name?.trim().toLowerCase()
  if (!name) return undefined
  const key = NAME_TO_KEY[name]
  return key ? exerciseImageByKey(key) : undefined
}
