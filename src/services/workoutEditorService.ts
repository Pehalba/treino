import { commitAll, patchMany } from '@/repositories/base'
import { exerciseRepository } from '@/repositories/exerciseRepository'
import { workoutRepository } from '@/repositories/workoutRepository'
import type {
  Equipment,
  Exercise,
  MuscleGroup,
  Profile,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@/types'
import { auditFields, isLive } from '@/utils/audit'
import { newId } from '@/utils/ids'

function requireName(value: string, label: string): string {
  const name = value.trim()
  if (!name) throw new Error(`${label} não pode ficar vazio.`)
  return name
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} inválido.`)
  return value
}

export const workoutEditorService = {
  async updateTemplateName(templateId: string, name: string, userId: string): Promise<void> {
    await workoutRepository.updateTemplate(templateId, {
      name: requireName(name, 'Nome do treino'),
      ...auditFields(userId),
    })
  },

  async archiveTemplate(templateId: string, userId: string): Promise<void> {
    await workoutRepository.updateTemplate(templateId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
  },

  async updateTemplateExercise(
    rowId: string,
    data: Partial<Pick<WorkoutTemplateExercise, 'sets' | 'repMin' | 'repMax' | 'restSeconds' | 'notes' | 'exerciseId'>>,
    userId: string,
  ): Promise<void> {
    if (data.sets != null && data.sets < 1) throw new Error('Séries deve ser pelo menos 1.')
    if (data.repMin != null && data.repMin < 0) throw new Error('Repetições mínimas inválidas.')
    if (data.repMax != null && data.repMax < 0) throw new Error('Repetições máximas inválidas.')
    if (data.repMin != null && data.repMax != null && data.repMax < data.repMin) {
      throw new Error('A faixa máxima de reps deve ser maior ou igual à mínima.')
    }
    if (data.restSeconds != null && data.restSeconds < 0) throw new Error('Descanso inválido.')
    await workoutRepository.updateTemplateExercise(rowId, { ...data, ...auditFields(userId) })
  },

  async archiveTemplateExercise(rowId: string, userId: string): Promise<void> {
    await workoutRepository.updateTemplateExercise(rowId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
  },

  async restoreTemplateExercise(rowId: string, userId: string): Promise<void> {
    await workoutRepository.updateTemplateExercise(rowId, {
      active: true,
      archivedAt: null,
      ...auditFields(userId),
    })
  },

  async reorderTemplateExercises(rows: WorkoutTemplateExercise[], userId: string): Promise<void> {
    await patchMany(
      rows.map((row, index) => ({
        collection: 'workoutTemplateExercises',
        id: row.id,
        data: { order: index, ...auditFields(userId) },
      })),
    )
  },

  async addExistingExercise(params: {
    profile: Profile
    template: WorkoutTemplate
    exerciseId: string
    userId: string
    order: number
  }): Promise<WorkoutTemplateExercise> {
    const exercise = await exerciseRepository.listByHousehold(params.profile.householdId).then((list) =>
      list.find((item) => item.id === params.exerciseId),
    )
    if (!exercise) throw new Error('Exercício não encontrado.')
    const row: WorkoutTemplateExercise = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      templateId: params.template.id,
      exerciseId: exercise.id,
      order: params.order,
      sets: exercise.defaultSets || 3,
      repMin: exercise.defaultRepMin,
      repMax: exercise.defaultRepMax,
      restSeconds: exercise.defaultRestSeconds,
      notes: '',
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
      version: 1,
    }
    await workoutRepository.saveTemplateExercise(row)
    await workoutRepository.updateTemplate(params.template.id, auditFields(params.userId))
    return row
  },

  async createAndAddExercise(params: {
    profile: Profile
    template: WorkoutTemplate
    userId: string
    order: number
    name: string
    muscleGroup: MuscleGroup
    equipment: Equipment
    youtubeUrl?: string
    description?: string
  }): Promise<{ exercise: Exercise; row: WorkoutTemplateExercise }> {
    const exercise: Exercise = {
      id: newId(),
      householdId: params.profile.householdId,
      name: requireName(params.name, 'Nome do exercício'),
      muscleGroup: params.muscleGroup,
      equipment: params.equipment,
      description: params.description ?? '',
      youtubeUrl: params.youtubeUrl?.trim() ?? '',
      alternativeIds: [],
      defaultSets: 3,
      defaultRepMin: 6,
      defaultRepMax: 10,
      defaultRestSeconds: 120,
      weightIncrement: 2,
      isPlaceholder: false,
      active: true,
      archivedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: params.userId,
      version: 1,
    }
    const row: WorkoutTemplateExercise = {
      id: newId(),
      profileId: params.profile.id,
      householdId: params.profile.householdId,
      templateId: params.template.id,
      exerciseId: exercise.id,
      order: params.order,
      sets: 3,
      repMin: 6,
      repMax: 10,
      restSeconds: 120,
      notes: '',
      active: true,
      archivedAt: null,
      updatedAt: Date.now(),
      updatedBy: params.userId,
      version: 1,
    }
    await commitAll([
      { collection: 'exercises', data: exercise },
      { collection: 'workoutTemplateExercises', data: row },
    ])
    await workoutRepository.updateTemplate(params.template.id, auditFields(params.userId))
    return { exercise, row }
  },

  async updateExercise(
    exerciseId: string,
    data: Partial<
      Pick<
        Exercise,
        | 'name'
        | 'muscleGroup'
        | 'equipment'
        | 'description'
        | 'youtubeUrl'
        | 'alternativeIds'
        | 'defaultSets'
        | 'defaultRepMin'
        | 'defaultRepMax'
        | 'defaultRestSeconds'
        | 'weightIncrement'
      >
    >,
    userId: string,
  ): Promise<void> {
    if (data.name != null) data.name = requireName(data.name, 'Nome do exercício')
    if (data.defaultSets != null) requirePositive(data.defaultSets, 'Séries')
    await exerciseRepository.update(exerciseId, { ...data, ...auditFields(userId) })
  },

  async archiveExercise(exerciseId: string, userId: string): Promise<void> {
    await exerciseRepository.update(exerciseId, {
      active: false,
      archivedAt: Date.now(),
      ...auditFields(userId),
    })
  },

  liveRows(rows: WorkoutTemplateExercise[]): WorkoutTemplateExercise[] {
    return rows.filter(isLive).sort((a, b) => a.order - b.order)
  },
}
