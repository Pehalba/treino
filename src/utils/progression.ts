import type { ExerciseSet, ProgressionSummary, PersonalRecord } from '@/types'
import { formatKg, formatNumber } from '@/utils/format'
import { bestSetScore, totalReps, totalVolume, workingWeight } from '@/utils/volume'

export function summarizeProgression(
  today: ExerciseSet[],
  previous: ExerciseSet[] | null,
  repMax: number,
): Omit<ProgressionSummary, 'isRecord' | 'recordTypes'> {
  const done = today.filter((s) => s.completed)
  if (done.length === 0) {
    return { kind: 'none', message: 'Nenhuma série concluída.', targetHit: false }
  }

  const targetHit = done.length > 0 && done.every((s) => s.reps >= repMax)
  const todayWeight = workingWeight(done)
  const todayReps = totalReps(done)
  const todayVol = totalVolume(done)

  if (!previous || previous.filter((s) => s.completed).length === 0) {
    return {
      kind: 'first',
      message: 'Primeira sessão registrada neste exercício.',
      targetHit,
    }
  }

  const prev = previous.filter((s) => s.completed)
  const prevWeight = workingWeight(prev)
  const prevReps = totalReps(prev)
  const prevVol = totalVolume(prev)

  if (todayWeight > prevWeight) {
    const delta = todayWeight - prevWeight
    return {
      kind: 'weight',
      message: `Carga aumentada +${formatNumber(delta)} kg`,
      targetHit,
    }
  }

  if (todayReps > prevReps) {
    const delta = todayReps - prevReps
    return {
      kind: 'reps',
      message: `+${delta} ${delta === 1 ? 'repetição' : 'repetições'} comparado à sessão anterior`,
      targetHit,
    }
  }

  if (todayVol > prevVol) {
    return {
      kind: 'volume',
      message: `Volume aumentou +${formatKg(todayVol - prevVol)}`,
      targetHit,
    }
  }

  return {
    kind: 'none',
    message: 'Sem progressão nesta sessão.',
    targetHit,
  }
}

export function detectNewRecords(
  today: ExerciseSet[],
  historySets: ExerciseSet[],
  sessionId: string,
): Array<Omit<PersonalRecord, 'id' | 'profileId' | 'householdId' | 'exerciseId'>> {
  const done = today.filter((s) => s.completed)
  if (done.length === 0) return []

  const others = historySets.filter((s) => s.completed && s.workoutSessionId !== sessionId)
  const records: Array<Omit<PersonalRecord, 'id' | 'profileId' | 'householdId' | 'exerciseId'>> = []
  const now = Date.now()

  const todayMaxWeight = Math.max(...done.map((s) => s.weight))
  const prevMaxWeight = others.length > 0 ? Math.max(...others.map((s) => s.weight)) : 0
  if (todayMaxWeight > prevMaxWeight) {
    records.push({
      type: 'max_weight',
      value: todayMaxWeight,
      weight: todayMaxWeight,
      sessionId,
      createdAt: now,
    })
  }

  const todayVolume = totalVolume(done)
  const volumeBySession = new Map<string, number>()
  for (const set of others) {
    volumeBySession.set(
      set.workoutSessionId,
      (volumeBySession.get(set.workoutSessionId) ?? 0) + set.weight * set.reps,
    )
  }
  const prevMaxVolume = volumeBySession.size > 0 ? Math.max(...volumeBySession.values()) : 0
  if (todayVolume > prevMaxVolume) {
    records.push({
      type: 'max_volume',
      value: todayVolume,
      weight: null,
      sessionId,
      createdAt: now,
    })
  }

  for (const set of done) {
    const prevBestReps = others
      .filter((s) => s.weight === set.weight)
      .reduce((max, s) => Math.max(max, s.reps), 0)
    if (set.reps > prevBestReps) {
      records.push({
        type: 'max_reps_at_weight',
        value: set.reps,
        weight: set.weight,
        sessionId,
        createdAt: now,
      })
      break
    }
  }

  return records
}

export function isStagnant(sessionGroups: ExerciseSet[][], minSessions = 3): boolean {
  if (sessionGroups.length < minSessions) return false
  const recent = sessionGroups.slice(0, minSessions)
  const weights = recent.map((sets) => workingWeight(sets))
  const reps = recent.map((sets) => totalReps(sets))
  const volumes = recent.map((sets) => totalVolume(sets))
  const scores = recent.map((sets) => bestSetScore(sets))

  const noWeight = weights.every((w) => w <= weights[weights.length - 1])
  const noReps = reps.every((r) => r <= reps[reps.length - 1])
  const noVolume = volumes.every((v) => v <= volumes[volumes.length - 1])
  const noBest = scores.every((s) => s <= scores[scores.length - 1])

  return noWeight && noReps && noVolume && noBest
}
