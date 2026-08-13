import { presetGoalsForProfile } from '@/data/diets'
import { profileRepository, buildProfile, buildProfileMember } from '@/repositories/profileRepository'
import { seedService } from '@/services/seedService'
import type { Household, Profile, ProfileAvatar, UserRecord } from '@/types'
import { auditFields } from '@/utils/audit'
import { inviteCode, newId } from '@/utils/ids'
import { avatarFromName } from '@/utils/profileAvatar'
import { withTimeout } from '@/utils/withTimeout'

const DEFAULT_PROFILES: Array<{ name: string; avatar: ProfileAvatar }> = [
  { name: 'Pedro', avatar: 'pedro' },
  { name: 'Carol', avatar: 'carol' },
  { name: 'Convidado', avatar: 'guest' },
]

export function sortProfiles(profiles: Profile[]): Profile[] {
  const rank = (name: string) => {
    const index = DEFAULT_PROFILES.findIndex((item) => item.name.toLowerCase() === name.toLowerCase())
    return index === -1 ? DEFAULT_PROFILES.length : index
  }
  return [...profiles].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'pt-BR'))
}

export const profileService = {
  async createHousehold(uid: string): Promise<Household> {
    const household: Household = {
      id: newId(),
      name: 'Pedro & Carol',
      inviteCode: inviteCode(),
      createdAt: Date.now(),
      createdBy: uid,
    }
    await profileRepository.saveHousehold(household)
    await profileRepository.saveInvite(household.inviteCode, household.id)
    return household
  },

  async rememberCanonicalHousehold(householdId: string): Promise<void> {
    try {
      const current = await profileRepository.getAppConfig()
      if (!current) {
        await profileRepository.saveAppConfig({ id: 'main', householdId, updatedAt: Date.now() })
        return
      }
      if (current.householdId !== householdId) {
        await profileRepository.updateAppConfig({ householdId, updatedAt: Date.now() })
      }
    } catch {
      /* rules ainda não publicadas — o grupo mais antigo continua a valer */
    }
  },

  householdLooksUsed(profiles: Profile[]): boolean {
    return profiles.some((profile) => (profile.heightCm ?? 0) > 0 || (profile.weightGoalKg ?? 0) > 0)
  },

  async resolveCanonicalHousehold(uid: string, existing: UserRecord | null): Promise<Household> {
    if (existing) {
      try {
        const mine = await withTimeout(profileRepository.getHousehold(existing.householdId), 4000, 'grupo atual')
        const myProfiles = await withTimeout(
          profileRepository.listHouseholdProfiles(existing.householdId),
          4000,
          'perfis atuais',
        )
        if (mine && this.householdLooksUsed(myProfiles)) {
          void this.rememberCanonicalHousehold(mine.id)
          return mine
        }
      } catch {
        /* aparelho novo ou leitura lenta — tenta o grupo partilhado */
      }
    }

    try {
      const config = await withTimeout(profileRepository.getAppConfig(), 3000, 'config')
      if (config?.householdId) {
        const pointed = await withTimeout(profileRepository.getHousehold(config.householdId), 3000, 'grupo partilhado')
        if (pointed) return pointed
      }
    } catch {
      /* appConfig indisponível */
    }

    try {
      const oldest = await withTimeout(profileRepository.listOldestHousehold(), 4000, 'grupo mais antigo')
      if (oldest) {
        void this.rememberCanonicalHousehold(oldest.id)
        return oldest
      }
    } catch {
      /* listagem lenta ou sem índice */
    }

    const created = await this.createHousehold(uid)
    void this.rememberCanonicalHousehold(created.id)
    return created
  },

  async ensureMembers(user: UserRecord): Promise<void> {
    const profiles = await profileRepository.listHouseholdProfiles(user.householdId)
    const already = await profileRepository.listMembersForUser(user.id)
    const alreadyIds = new Set(already.map((item) => item.profileId))
    for (const profile of profiles) {
      if (alreadyIds.has(profile.id)) continue
      await profileRepository.saveMember(buildProfileMember(user.id, profile.id, user.householdId, 'member'))
    }
  },

  async attachToHousehold(user: UserRecord, household: Household): Promise<UserRecord> {
    if (user.householdId === household.id) {
      try {
        await withTimeout(this.ensureMembers(user), 5000, 'membros')
      } catch {
        /* segue com os perfis */
      }
      return user
    }
    await withTimeout(profileRepository.updateUser(user.id, { householdId: household.id }), 5000, 'atualizar grupo')
    const updated = { ...user, householdId: household.id }
    try {
      await withTimeout(this.ensureMembers(updated), 5000, 'membros')
    } catch {
      /* segue com os perfis */
    }
    return updated
  },

  async bootstrapUser(uid: string, email: string, displayName: string): Promise<{ user: UserRecord; profile: Profile; profiles: Profile[] }> {
    const existing = await withTimeout(profileRepository.getUser(uid), 4000, 'utilizador').catch(() => null)
    const household = await this.resolveCanonicalHousehold(uid, existing)

    const user = existing
      ? await this.attachToHousehold(existing, household)
      : await (async () => {
          const created: UserRecord = {
            id: uid,
            email,
            displayName: displayName || 'Pedro & Carol',
            householdId: household.id,
            createdAt: Date.now(),
          }
          await withTimeout(profileRepository.saveUser(created), 5000, 'guardar utilizador')
          try {
            await withTimeout(this.ensureMembers(created), 5000, 'membros')
          } catch {
            /* os perfis ainda abrem */
          }
          return created
        })()

    const profiles = await this.ensureDefaultProfiles(user)
    const profile = profiles[0]
    if (!profile) throw new Error('Não foi possível carregar os perfis.')
    return { user, profile, profiles }
  },

  async ensureDefaultProfiles(user: UserRecord): Promise<Profile[]> {
    const current = sortProfiles(
      await withTimeout(profileRepository.listHouseholdProfiles(user.householdId), 5000, 'perfis'),
    )
    const names = new Set(current.map((item) => item.name.trim().toLowerCase()))
    const created: Profile[] = []
    for (const def of DEFAULT_PROFILES) {
      if (names.has(def.name.toLowerCase())) continue
      created.push(await this.createProfile(user, def.name, { seed: false, avatar: def.avatar }))
    }
    const profiles = created.length
      ? sortProfiles(await profileRepository.listHouseholdProfiles(user.householdId))
      : current

    setTimeout(() => {
      void this.seedInBackground(user, profiles)
    }, created.length === 0 ? 2500 : 0)
    return profiles
  },

  async seedInBackground(user: UserRecord, profiles: Profile[]): Promise<void> {
    const pedro = profiles.find((profile) => profile.name.trim().toLowerCase() === 'pedro')
    for (const profile of profiles) {
      const isGuest = profile.name.trim().toLowerCase() === 'convidado'
      if (isGuest && pedro && pedro.id !== profile.id) {
        await seedService.seedProfile(pedro.id, user.householdId)
        await seedService.seedFromProfile(pedro.id, profile.id, user.householdId)
      } else {
        await seedService.seedProfile(profile.id, user.householdId)
      }
    }
  },

  async createProfile(
    user: UserRecord,
    name: string,
    options: { seed?: boolean; avatar?: ProfileAvatar } = {},
  ): Promise<Profile> {
    const seed = options.seed ?? true
    const avatar = options.avatar ?? avatarFromName(name)
    const goals = presetGoalsForProfile(name, avatar)
    const profile = buildProfile({
      householdId: user.householdId,
      ownerUserId: user.id,
      name,
      avatar,
      weeklyWorkoutGoal: 4,
      calorieGoal: goals?.calorieGoal ?? 3500,
      proteinGoal: goals?.proteinGoal ?? 180,
      carbGoal: goals?.carbGoal ?? 400,
      fatGoal: goals?.fatGoal ?? 90,
      heightCm: null,
      weightGoalKg: null,
      timerSeconds: 120,
      ageYears: 25,
      activityMultiplier: 1.5,
      goal: 'bulking',
    })
    await profileRepository.saveProfile(profile)
    await profileRepository.saveMember(buildProfileMember(user.id, profile.id, user.householdId, 'owner'))
    if (seed) await seedService.seedProfile(profile.id, user.householdId)
    return profile
  },

  async listAccessibleProfiles(uid: string): Promise<Profile[]> {
    const user = await profileRepository.getUser(uid)
    if (!user) return []
    return sortProfiles(await profileRepository.listHouseholdProfiles(user.householdId))
  },

  async joinHousehold(
    uid: string,
    code: string,
  ): Promise<{ user: UserRecord; household: Household; profiles: Profile[] }> {
    const invite = await profileRepository.getInvite(code.trim().toUpperCase())
    if (!invite) throw new Error('Código inválido.')
    const household = await profileRepository.getHousehold(invite.householdId)
    if (!household) throw new Error('Grupo não encontrado.')
    const current = await profileRepository.getUser(uid)
    if (!current) throw new Error('Não foi possível entrar no grupo.')
    const user = await this.attachToHousehold(current, household)
    await this.rememberCanonicalHousehold(household.id)
    const profiles = sortProfiles(await profileRepository.listHouseholdProfiles(household.id))
    return { user, household, profiles }
  },

  async updateProfile(
    profileId: string,
    data: Partial<
      Pick<
        Profile,
        | 'name'
        | 'heightCm'
        | 'weightGoalKg'
        | 'goal'
        | 'weeklyWorkoutGoal'
        | 'calorieGoal'
        | 'proteinGoal'
        | 'carbGoal'
        | 'fatGoal'
        | 'timerSeconds'
        | 'ageYears'
        | 'activityMultiplier'
      >
    >,
    userId: string,
  ): Promise<void> {
    if (data.name != null && !data.name.trim()) throw new Error('Nome não pode ficar vazio.')
    if (data.heightCm != null && data.heightCm < 0) throw new Error('Altura inválida.')
    if (data.weightGoalKg != null && data.weightGoalKg < 0) throw new Error('Meta de peso inválida.')
    if (data.timerSeconds != null && (data.timerSeconds < 15 || data.timerSeconds > 1800)) {
      throw new Error('Timer inválido. Use entre 15 segundos e 30 minutos.')
    }
    if (data.weeklyWorkoutGoal != null && data.weeklyWorkoutGoal < 0) throw new Error('Meta de treinos inválida.')
    if (data.calorieGoal != null && data.calorieGoal < 0) throw new Error('Meta de calorias inválida.')
    if (data.ageYears != null && (data.ageYears < 10 || data.ageYears > 90)) throw new Error('Idade inválida.')
    if (data.activityMultiplier != null && (data.activityMultiplier < 1.1 || data.activityMultiplier > 2.2)) {
      throw new Error('Fator de atividade inválido.')
    }
    await profileRepository.updateProfile(profileId, { ...data, ...auditFields(userId) })
  },

  async updateGoals(
    profileId: string,
    data: Partial<Pick<Profile, 'weeklyWorkoutGoal' | 'calorieGoal' | 'proteinGoal' | 'carbGoal' | 'fatGoal' | 'name'>>,
    userId?: string,
  ): Promise<void> {
    await this.updateProfile(profileId, data, userId ?? '')
  },

  subscribeHouseholdProfiles: profileRepository.subscribeHouseholdProfiles,
  getHousehold: profileRepository.getHousehold,
}
