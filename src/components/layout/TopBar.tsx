import { Link } from 'react-router-dom'
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher'

export function TopBar({ title, toProfile = '/perfil' }: { title?: string; toProfile?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-bg/90 px-4 pt-[calc(env(safe-area-inset-top)+1.75rem)] pb-3 backdrop-blur lg:px-8 lg:pt-3">
      <div className="flex items-center gap-3">
        <ProfileSwitcher />
        {title ? <h1 className="font-display text-lg font-semibold">{title}</h1> : null}
      </div>
      <Link
        to={toProfile}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card2 text-sm font-bold"
        aria-label="Perfil e configurações"
      >
        ⚙
      </Link>
    </header>
  )
}
