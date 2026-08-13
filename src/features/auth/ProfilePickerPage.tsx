import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/hooks/useSession'
import { profileService } from '@/services/profileService'
import { cn } from '@/utils/cn'
import { clearBootCache } from '@/utils/localSession'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function ProfilePickerPage() {
  const { profiles, selectProfile, activeProfile, user } = useSession()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  function pick(profileId: string) {
    selectProfile(profileId)
    navigate('/', { replace: true })
  }

  async function join() {
    if (!user || !joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      await profileService.joinHousehold(user.id, joinCode)
      clearBootCache()
      window.location.reload()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Código inválido.')
      setJoining(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-5 py-12">
      <p className="text-xs font-semibold tracking-[0.28em] text-accent uppercase">Pedro & Carol</p>
      <h1 className="mt-5 text-center font-display text-3xl font-semibold sm:text-5xl">Quem vai treinar?</h1>
      <p className="mt-3 text-center text-sm text-muted">Toque no perfil para entrar</p>

      <ul className="mt-10 grid w-full max-w-sm grid-cols-3 items-start gap-2 sm:mt-14 sm:max-w-lg sm:gap-8">
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

      <div className="mt-12 w-full max-w-sm rounded-3xl bg-card p-4 sm:max-w-lg">
        <h2 className="font-display text-lg">Já usa no celular?</h2>
        <p className="mt-2 text-sm text-muted">
          Celular e PC começam separados. No outro aparelho, abra Perfil e copie o código do grupo. Cole aqui para ver
          altura, peso, dieta e treinos iguais.
        </p>
        <Input
          className="mt-3"
          placeholder="Código do grupo"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        {joinError ? <p className="mt-2 text-sm text-danger">{joinError}</p> : null}
        <Button className="mt-3 w-full" variant="secondary" disabled={joining || !joinCode.trim()} onClick={() => void join()}>
          {joining ? 'Entrando…' : 'Usar dados do outro aparelho'}
        </Button>
      </div>
    </div>
  )
}
