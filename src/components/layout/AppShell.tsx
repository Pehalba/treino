import { BottomNav, Sidebar } from '@/components/layout/Navigation'
import { TopBar } from '@/components/layout/TopBar'
import type { ReactNode } from 'react'

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-svh bg-bg lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <TopBar title={title} />
        <main className="mx-auto w-full max-w-6xl px-4 lg:px-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
