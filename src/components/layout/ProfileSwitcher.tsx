import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { useSession } from '@/hooks/useSession'
import { useNavigate } from 'react-router-dom'

export function ProfileSwitcher() {
  const { activeProfile } = useSession()
  const navigate = useNavigate()
  if (!activeProfile) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/quem')}
      className="flex items-center gap-2 rounded-full bg-card2 py-1 pr-3 pl-1 text-sm font-semibold"
      aria-label="Trocar perfil"
    >
      <ProfileAvatar profile={activeProfile} size="sm" />
      {activeProfile.name}
    </button>
  )
}
