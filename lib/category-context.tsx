'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import { getCurrentUser } from './auth'

// Default categories that come with the app
export const defaultCategories = [
  'Food & Dining',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal',
  'Other'
]

// Default category colors
export const defaultCategoryColors = {
  'Food & Dining': 'bg-red-100 text-red-800',
  'Transportation': 'bg-blue-100 text-blue-800',
  'Shopping': 'bg-purple-100 text-purple-800',
  'Entertainment': 'bg-pink-100 text-pink-800',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-800',
  'Healthcare': 'bg-green-100 text-green-800',
  'Travel': 'bg-indigo-100 text-indigo-800',
  'Education': 'bg-teal-100 text-teal-800',
  'Personal': 'bg-gray-100 text-gray-800',
  'Other': 'bg-orange-100 text-orange-800'
}

// Extended color palette for custom categories
const customColorPalette = [
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-lime-100 text-lime-800',
  'bg-emerald-100 text-emerald-800',
  'bg-cyan-100 text-cyan-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-stone-100 text-stone-800',
  'bg-zinc-100 text-zinc-800'
]

interface CategoryContextType {
  categories: string[]
  categoryColors: Record<string, string>
  addCategory: (category: string) => Promise<void>
  removeCategory: (category: string) => Promise<void>
  isLoading: boolean
  refreshCategories: () => Promise<void>
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

interface CategoryProviderProps {
  children: ReactNode
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(defaultCategoryColors)
  const [isLoading, setIsLoading] = useState(true)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      
      if (!user || user.isDemo) {
        // Load from localStorage for demo users
        const savedCategories = localStorage.getItem('customCategories')
        const savedColors = localStorage.getItem('customCategoryColors')
        
        if (savedCategories) {
          const customCategories = JSON.parse(savedCategories)
          setCategories([...defaultCategories, ...customCategories])
        }
        
        if (savedColors) {
          const customColors = JSON.parse(savedColors)
          setCategoryColors({ ...defaultCategoryColors, ...customColors })
        }
      } else {
        // Load from Supabase for real users
        const { data, error } = await supabase
          .from('user_categories')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error loading categories:', error)
          return
        }

        if (data && data.length > 0) {
          const customCategories = data.map(cat => cat.name)
          const customColors: Record<string, string> = {}
          
          data.forEach(cat => {
            customColors[cat.name] = cat.color
          })

          setCategories([...defaultCategories, ...customCategories])
          setCategoryColors({ ...defaultCategoryColors, ...customColors })
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNextAvailableColor = () => {
    const usedColors = Object.values(categoryColors)
    const availableColor = customColorPalette.find(color => !usedColors.includes(color))
    return availableColor || customColorPalette[0] // Fallback to first color if all used
  }

  const addCategory = async (categoryName: string) => {
    if (categories.includes(categoryName)) {
      throw new Error('Category already exists')
    }

    const newColor = getNextAvailableColor()
    
    try {
      const user = await getCurrentUser()
      
      if (!user || user.isDemo) {
        // Save to localStorage for demo users
        const customCategories = categories.filter(cat => !defaultCategories.includes(cat))
        const updatedCustomCategories = [...customCategories, categoryName]
        localStorage.setItem('customCategories', JSON.stringify(updatedCustomCategories))
        
        const customColors = { ...categoryColors }
        customColors[categoryName] = newColor
        localStorage.setItem('customCategoryColors', JSON.stringify(
          Object.fromEntries(
            Object.entries(customColors).filter(([key]) => !(key in defaultCategoryColors))
          )
        ))
      } else {
        // Save to Supabase for real users
        const { error } = await supabase
          .from('user_categories')
          .insert([{
            user_id: user.id,
            name: categoryName,
            color: newColor
          }])

        if (error) {
          throw error
        }
      }

      // Update local state
      setCategories(prev => [...prev, categoryName])
      setCategoryColors(prev => ({ ...prev, [categoryName]: newColor }))
    } catch (error) {
      console.error('Error adding category:', error)
      throw error
    }
  }

  const removeCategory = async (categoryName: string) => {
    // Don't allow removing default categories
    if (defaultCategories.includes(categoryName)) {
      throw new Error('Cannot remove default categories')
    }

    try {
      const user = await getCurrentUser()
      
      if (!user || user.isDemo) {
        // Remove from localStorage for demo users
        const customCategories = categories.filter(cat => !defaultCategories.includes(cat) && cat !== categoryName)
        localStorage.setItem('customCategories', JSON.stringify(customCategories))
        
        const customColors = { ...categoryColors }
        delete customColors[categoryName]
        localStorage.setItem('customCategoryColors', JSON.stringify(
          Object.fromEntries(
            Object.entries(customColors).filter(([key]) => !(key in defaultCategoryColors))
          )
        ))
      } else {
        // Remove from Supabase for real users
        const { error } = await supabase
          .from('user_categories')
          .delete()
          .eq('user_id', user.id)
          .eq('name', categoryName)

        if (error) {
          throw error
        }
      }

      // Update local state
      setCategories(prev => prev.filter(cat => cat !== categoryName))
      setCategoryColors(prev => {
        const updated = { ...prev }
        delete updated[categoryName]
        return updated
      })
    } catch (error) {
      console.error('Error removing category:', error)
      throw error
    }
  }

  const refreshCategories = async () => {
    await loadCategories()
  }

  const value: CategoryContextType = {
    categories,
    categoryColors,
    addCategory,
    removeCategory,
    isLoading,
    refreshCategories
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories(): CategoryContextType {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
}

// Helper function to check if a category is custom (not default)
export function isCustomCategory(category: string): boolean {
  return !defaultCategories.includes(category)
}
