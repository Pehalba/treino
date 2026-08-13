const PREFIX = 'fit.lastLoad.'

export type LastExerciseLoad = {
  weight: number
  reps: number
}

function key(profileId: string): string {
  return `${PREFIX}${profileId}`
}

function readAll(profileId: string): Record<string, LastExerciseLoad> {
  try {
    const raw = localStorage.getItem(key(profileId))
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LastExerciseLoad>
  } catch {
    return {}
  }
}

export function getLastLoad(profileId: string, exerciseId: string): LastExerciseLoad | null {
  return readAll(profileId)[exerciseId] ?? null
}

export function saveLastLoad(profileId: string, exerciseId: string, load: LastExerciseLoad): void {
  if (!exerciseId || load.weight < 0) return
  try {
    const all = readAll(profileId)
    all[exerciseId] = { weight: load.weight, reps: load.reps }
    localStorage.setItem(key(profileId), JSON.stringify(all))
  } catch {
    /* quota / private mode */
  }
}
