'use client'

import { useEffect, useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { MainLayout } from '@/components/layout/main-layout'
import { getCurrentUser, onAuthStateChange } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing user
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
      if (user) {
        router.push('/dashboard')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      if (user) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleAuthSuccess = () => {
    // User will be redirected by the auth state change listener
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />
  }

  return (
    <MainLayout user={user} onSignOut={handleSignOut}>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Smart Expense Tracker</h1>
        <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
      </div>
    </MainLayout>
  )
}

