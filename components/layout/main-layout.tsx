'use client'

import { Sidebar } from './sidebar'
import type { AuthUser } from '@/lib/auth'

interface MainLayoutProps {
  user: AuthUser
  onSignOut: () => void
  children: React.ReactNode
}

export function MainLayout({ user, onSignOut, children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onSignOut={onSignOut} />
      
      {/* Main content */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <main className="main-content flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
