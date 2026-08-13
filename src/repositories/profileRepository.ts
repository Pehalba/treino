import { limit, orderBy, where } from 'firebase/firestore'
import { createDoc, getById, listDocs, patchDoc, subscribeDocs } from '@/repositories/base'
import type { AppConfig, Household, Profile, ProfileMember, UserRecord } from '@/types'
import { newId } from '@/utils/ids'
import type { Unsubscribe } from 'firebase/firestore'

export const profileRepository = {
  getUser: (uid: string) => getById<UserRecord>('users', uid),
  saveUser: (user: UserRecord) => createDoc('users', user),
  updateUser: (uid: string, data: Partial<UserRecord>) => patchDoc('users', uid, data),

  getHousehold: (id: string) => getById<Household>('households', id),
  saveHousehold: (household: Household) => createDoc('households', household),
  listOldestHousehold: async () => {
    const items = await listDocs<Household>('households', orderBy('createdAt', 'asc'), limit(1))
    return items[0] ?? null
  },
  getInvite: (code: string) => getById<{ id: string; householdId: string; code: string }>('householdInvites', code),
  saveInvite: (code: string, householdId: string) =>
    createDoc('householdInvites', { id: code, householdId, code }),

  getAppConfig: () => getById<AppConfig>('appConfig', 'main'),
  saveAppConfig: (data: AppConfig) => createDoc('appConfig', data),
  updateAppConfig: (data: Partial<AppConfig>) => patchDoc('appConfig', 'main', data),
  saveProfile: (profile: Profile) => createDoc('profiles', profile),
  updateProfile: (id: string, data: Partial<Profile> | Record<string, unknown>) => patchDoc('profiles', id, data),
  listHouseholdProfiles: (householdId: string) =>
    listDocs<Profile>('profiles', where('householdId', '==', householdId)),
  subscribeHouseholdProfiles: (
    householdId: string,
    onData: (items: Profile[]) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe => subscribeDocs<Profile>('profiles', [where('householdId', '==', householdId)], onData, onError),

  saveMember: (member: ProfileMember) => createDoc('profileMembers', member),
  listMembersForUser: (userId: string) =>
    listDocs<ProfileMember>('profileMembers', where('userId', '==', userId)),
}

export function buildProfileMember(userId: string, profileId: string, householdId: string, role: ProfileMember['role']): ProfileMember {
  return {
    id: `${userId}_${profileId}`,
    userId,
    profileId,
    householdId,
    role,
  }
}

export function buildProfile(input: Omit<Profile, 'id' | 'createdAt'> & { id?: string }): Profile {
  return {
    id: input.id ?? newId(),
    createdAt: Date.now(),
    ...input,
  }
}
