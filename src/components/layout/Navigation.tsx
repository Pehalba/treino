import { BarChart3, Dumbbell, Flame, Home, Utensils } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/treino', label: 'Treino', icon: Dumbbell },
  { to: '/calorias', label: 'Calorias', icon: Flame },
  { to: '/dietas', label: 'Dietas', icon: Utensils },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5 px-1 pt-2 pb-2">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[11px]',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <item.icon size={22} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-line bg-card px-4 py-6 lg:flex">
      <div className="px-2 font-display text-lg font-semibold">
        Treinos
        <span className="mt-1 block text-xs font-medium text-muted">Pedro & Carol</span>
      </div>
      <ul className="mt-8 space-y-1">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-card2 hover:text-ink',
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  )
}
