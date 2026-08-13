import { profileRepository, buildProfile, buildProfileMember } from '@/repositories/profileRepository'
import { seedService } from '@/services/seedService'
import type { Household, Profile, ProfileAvatar, UserRecord } from '@/types'
import { auditFields } from '@/utils/audit'
import { inviteCode, newId } from '@/utils/ids'
import { avatarFromName } from '@/utils/profileAvatar'

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
  async bootstrapUser(uid: string, email: string, displayName: string): Promise<{ user: UserRecord; profile: Profile; profiles: Profile[] }> {
    const existing = await profileRepository.getUser(uid)
    if (existing) {
      const current = sortProfiles(await profileRepository.listHouseholdProfiles(existing.householdId))
      if (current.length > 0) {
        void this.ensureDefaultProfiles(existing)
        return { user: existing, profile: current[0], profiles: current }
      }
      const profiles = await this.ensureDefaultProfiles(existing)
      const profile = profiles[0]
      if (!profile) throw new Error('Não foi possível carregar os perfis.')
      return { user: existing, profile, profiles }
    }

    const household: Household = {
      id: newId(),
      name: 'Pedro & Carol',
      inviteCode: inviteCode(),
      createdAt: Date.now(),
      createdBy: uid,
    }
    await profileRepository.saveHousehold(household)
    await profileRepository.saveInvite(household.inviteCode, household.id)

    const user: UserRecord = {
      id: uid,
      email,
      displayName: displayName || 'Pedro & Carol',
      householdId: household.id,
      createdAt: Date.now(),
    }
    await profileRepository.saveUser(user)

    const profiles = await this.ensureDefaultProfiles(user)
    const profile = profiles[0]
    if (!profile) throw new Error('Não foi possível criar os perfis.')
    return { user, profile, profiles }
  },

  async ensureDefaultProfiles(user: UserRecord): Promise<Profile[]> {
    const current = sortProfiles(await profileRepository.listHouseholdProfiles(user.householdId))
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
    const profile = buildProfile({
      householdId: user.householdId,
      ownerUserId: user.id,
      name,
      avatar: options.avatar ?? avatarFromName(name),
      weeklyWorkoutGoal: 4,
      calorieGoal: 3500,
      proteinGoal: 180,
      carbGoal: 400,
      fatGoal: 90,
      heightCm: null,
      weightGoalKg: null,
      timerSeconds: 120,
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

  async joinHousehold(uid: string, code: string): Promise<void> {
    const invite = await profileRepository.getInvite(code.trim().toUpperCase())
    if (!invite) throw new Error('Código inválido.')
    const household = await profileRepository.getHousehold(invite.householdId)
    if (!household) throw new Error('Grupo não encontrado.')
    await profileRepository.updateUser(uid, { householdId: household.id })
    const user = await profileRepository.getUser(uid)
    if (!user) return
    const profiles = await profileRepository.listHouseholdProfiles(household.id)
    const already = await profileRepository.listMembersForUser(uid)
    const alreadyIds = new Set(already.map((m) => m.profileId))
    for (const profile of profiles) {
      if (alreadyIds.has(profile.id)) continue
      await profileRepository.saveMember(buildProfileMember(uid, profile.id, household.id, 'member'))
    }
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
