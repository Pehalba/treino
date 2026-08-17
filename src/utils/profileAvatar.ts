import type { Profile, ProfileAvatar } from '@/types'

export function resolveProfileAvatar(profile: Pick<Profile, 'name' | 'avatar'>): ProfileAvatar {
  if (profile.avatar) return profile.avatar
  const name = profile.name.trim().toLowerCase()
  if (name.includes('carol')) return 'carol'
  if (name.includes('luiz')) return 'luiz'
  if (name.includes('convid') || name.includes('guest')) return 'guest'
  if (name.includes('pedro')) return 'pedro'
  return 'guest'
}

export function avatarFromName(name: string): ProfileAvatar {
  return resolveProfileAvatar({ name, avatar: undefined })
}
