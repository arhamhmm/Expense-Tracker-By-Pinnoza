import { supabase, DEMO_USER, isDemoUser } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  isDemo: boolean
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithDemo = async () => {
  // For demo purposes, we'll simulate a successful login
  // In a real app, you might want to create an actual demo user in Supabase
  const demoUser: AuthUser = {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    isDemo: true,
  }
  
  // Store demo user info in localStorage for persistence
  localStorage.setItem('demo-user', JSON.stringify(demoUser))
  
  return { user: demoUser, error: null }
}

export const signOut = async () => {
  // Clear demo user from localStorage
  localStorage.removeItem('demo-user')
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  // Check for demo user first
  const demoUser = localStorage.getItem('demo-user')
  if (demoUser) {
    return JSON.parse(demoUser)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return {
    id: user.id,
    email: user.email || '',
    isDemo: isDemoUser(user.id),
  }
}

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('demo-user')
      callback(null)
      return
    }

    if (session?.user) {
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        isDemo: isDemoUser(session.user.id),
      }
      callback(authUser)
    } else {
      // Check for demo user
      const demoUser = localStorage.getItem('demo-user')
      if (demoUser) {
        callback(JSON.parse(demoUser))
      } else {
        callback(null)
      }
    }
  })
}

