import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://suvjrrowdeyjzeknhxsf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dmpycm93ZGV5anpla25oeHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzY5MDAsImV4cCI6MjA3Mjc1MjkwMH0.3o3Bpo4e1mplh5LXdCb0PkW6LIP3TdKrd4gZCAR-VBE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Demo user credentials
export const DEMO_USER = {
  email: 'demo@expense-tracker.com',
  password: 'demo123456',
  id: 'demo-user-id'
}

// Check if current user is demo user
export const isDemoUser = (userId: string | undefined) => {
  return userId === DEMO_USER.id || userId === 'demo-user-id'
}

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          date: string
          category: string
          description: string
          amount: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          category: string
          description: string
          amount: number
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          category?: string
          description?: string
          amount?: number
          currency?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          budget: number
          spent: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          budget: number
          spent?: number
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          budget?: number
          spent?: number
          currency?: string
          created_at?: string
        }
      }
      project_entries: {
        Row: {
          id: string
          project_id: string
          date: string
          description: string
          amount: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          description: string
          amount: number
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          description?: string
          amount?: number
          currency?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          balance: number
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          balance?: number
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          balance?: number
        }
      }
      shared_expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          paid_by?: string
          created_at?: string
        }
      }
      user_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
    }
  }
}
