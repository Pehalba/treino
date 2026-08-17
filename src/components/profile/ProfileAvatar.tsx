import { Dumbbell, Heart, UserRound, Zap } from 'lucide-react'
import type { Profile } from '@/types'
import { cn } from '@/utils/cn'
import { resolveProfileAvatar } from '@/utils/profileAvatar'

const PRESETS = {
  pedro: {
    icon: Dumbbell,
    className: 'bg-[#16382c] text-accent',
  },
  carol: {
    icon: Heart,
    className: 'bg-[#4a1d33] text-[#ff8ab4]',
  },
  guest: {
    icon: UserRound,
    className: 'bg-[#243044] text-[#9ec1ff]',
  },
  luiz: {
    icon: Zap,
    className: 'bg-[#3a2a12] text-[#ffc14a]',
  },
} as const

export function ProfileAvatar({
  profile,
  size = 'md',
  className,
}: {
  profile: Pick<Profile, 'name' | 'avatar'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const preset = PRESETS[resolveProfileAvatar(profile)]
  const Icon = preset.icon
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden',
        size === 'sm' && 'h-8 w-8 rounded-full',
        size === 'md' && 'h-16 w-16 rounded-2xl',
        size === 'lg' && 'h-20 w-20 rounded-2xl sm:h-32 sm:w-32',
        preset.className,
        className,
      )}
    >
      <Icon size={size === 'sm' ? 18 : size === 'lg' ? 36 : 28} strokeWidth={2.2} />
    </div>
  )
}
