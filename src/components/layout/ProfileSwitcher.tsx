import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/utils/cn'

export function ProfileSwitcher() {
  const { profiles, activeProfile, selectProfile } = useSession()
  const [open, setOpen] = useState(false)
  if (!activeProfile) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full bg-card2 px-3 py-2 text-sm font-semibold"
      >
        {activeProfile.name}
        <ChevronDown size={16} className={cn('text-muted transition', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-2 min-w-40 overflow-hidden rounded-2xl bg-card2 p-1 shadow-xl">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={cn(
                'block w-full rounded-xl px-3 py-2.5 text-left text-sm',
                profile.id === activeProfile.id ? 'bg-accent/15 text-accent' : 'text-ink',
              )}
              onClick={() => {
                selectProfile(profile.id)
                setOpen(false)
              }}
            >
              {profile.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
