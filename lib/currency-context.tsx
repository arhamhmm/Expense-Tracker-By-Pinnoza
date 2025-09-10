'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getUserCurrency, setUserCurrency, type CurrencyCode } from './utils'

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user's preferred currency on mount (client-side only)
    if (typeof window !== 'undefined') {
      const userCurrency = getUserCurrency()
      setCurrencyState(userCurrency)
    }
    setIsLoading(false)
  }, [])

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    if (typeof window !== 'undefined') {
      setUserCurrency(newCurrency)
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
