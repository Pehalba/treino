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

      <ul className="mt-10 grid w-full max-w-sm grid-cols-2 items-start gap-4 sm:mt-14 sm:max-w-lg sm:grid-cols-4 sm:gap-6">
        {profiles.map((profile) => {
          const selected = profile.id === activeProfile?.id
          return (
            <li key={profile.id} className="min-w-0">
              <button
                type="button"
                onClick={() => pick(profile.id)}
                className="group flex w-full flex-col items-center gap-2 focus:outline-none sm:gap-3"
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
                    'w-full text-center text-sm font-medium leading-tight break-words transition group-hover:text-ink sm:text-lg',
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
