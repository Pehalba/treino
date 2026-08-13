import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'

export function ProfilePickerPage() {
  const { profiles, selectProfile, activeProfile } = useSession()
  const navigate = useNavigate()

  function pick(profileId: string) {
    selectProfile(profileId)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-5 py-12">
      <p className="text-xs font-semibold tracking-[0.28em] text-accent uppercase">Pedro & Carol</p>
      <h1 className="mt-5 text-center font-display text-3xl font-semibold sm:text-5xl">Quem vai treinar?</h1>
      <p className="mt-3 text-center text-sm text-muted">Toque no perfil para entrar</p>

      <ul className="mt-14 flex flex-wrap items-start justify-center gap-8 sm:gap-12">
        {profiles.map((profile) => {
          const selected = profile.id === activeProfile?.id
          return (
            <li key={profile.id}>
              <button
                type="button"
                onClick={() => pick(profile.id)}
                className="group flex flex-col items-center gap-3 focus:outline-none"
              >
                <div
                  className={cn(
                    'rounded-2xl ring-2 transition duration-200 group-hover:scale-[1.04] group-hover:ring-white group-focus-visible:ring-white',
                    selected ? 'ring-accent' : 'ring-transparent',
                  )}
                >
                  <ProfileAvatar profile={profile} size="lg" />
                </div>
                <span
                  className={cn(
                    'text-lg font-medium transition group-hover:text-ink',
                    selected ? 'text-ink' : 'text-muted',
                  )}
                >
                  {profile.name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
