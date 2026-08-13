import { profileRepository, buildProfile, buildProfileMember } from '@/repositories/profileRepository'
import { seedService } from '@/services/seedService'
import type { Household, Profile, UserRecord } from '@/types'
import { inviteCode, newId } from '@/utils/ids'

const DEFAULT_PROFILES = ['Pedro', 'Carol'] as const

export function sortProfiles(profiles: Profile[]): Profile[] {
  const rank = (name: string) => {
    const index = DEFAULT_PROFILES.findIndex((item) => item.toLowerCase() === name.toLowerCase())
    return index === -1 ? DEFAULT_PROFILES.length : index
  }
  return [...profiles].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'pt-BR'))
}

export const profileService = {
  async bootstrapUser(uid: string, email: string, displayName: string): Promise<{ user: UserRecord; profile: Profile }> {
    const existing = await profileRepository.getUser(uid)
    if (existing) {
    const profiles = await this.ensureDefaultProfiles(existing)
    const profile = profiles[0]
    if (!profile) throw new Error('Não foi possível carregar os perfis.')
    return { user: existing, profile }
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
    return { user, profile }
  },

  async ensureDefaultProfiles(user: UserRecord): Promise<Profile[]> {
    const current = await this.listAccessibleProfiles(user.id)
    const names = new Set(current.map((item) => item.name.trim().toLowerCase()))
    for (const name of DEFAULT_PROFILES) {
      if (names.has(name.toLowerCase())) continue
      await this.createProfile(user, name)
    }
    const profiles = sortProfiles(await this.listAccessibleProfiles(user.id))
    for (const profile of profiles) {
      await seedService.seedProfile(profile.id, user.householdId)
    }
    return profiles
  },

  async createProfile(user: UserRecord, name: string): Promise<Profile> {
    const profile = buildProfile({
      householdId: user.householdId,
      ownerUserId: user.id,
      name,
      weeklyWorkoutGoal: 4,
      calorieGoal: 3500,
      proteinGoal: 180,
      carbGoal: 400,
      fatGoal: 90,
    })
    await profileRepository.saveProfile(profile)
    await profileRepository.saveMember(buildProfileMember(user.id, profile.id, user.householdId, 'owner'))
    await seedService.seedProfile(profile.id, user.householdId)
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

  async updateGoals(
    profileId: string,
    data: Partial<Pick<Profile, 'weeklyWorkoutGoal' | 'calorieGoal' | 'proteinGoal' | 'carbGoal' | 'fatGoal' | 'name'>>,
  ): Promise<void> {
    await profileRepository.updateProfile(profileId, data)
  },

  subscribeHouseholdProfiles: profileRepository.subscribeHouseholdProfiles,
  getHousehold: profileRepository.getHousehold,
}
