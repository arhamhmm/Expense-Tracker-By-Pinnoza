'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { currencies, getUserCurrency, setUserCurrency, type CurrencyCode } from '@/lib/utils'

interface CurrencySelectorProps {
  value?: CurrencyCode
  onValueChange?: (currency: CurrencyCode) => void
  disabled?: boolean
  className?: string
}

export function CurrencySelector({ value, onValueChange, disabled, className }: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD')

  useEffect(() => {
    if (value && currencies[value]) {
      setSelectedCurrency(value)
    } else {
      // Only get user currency on client side
      if (typeof window !== 'undefined') {
        const userCurrency = getUserCurrency()
        // Ensure the currency exists in our currencies object
        if (currencies[userCurrency]) {
          setSelectedCurrency(userCurrency)
        } else {
          setSelectedCurrency('USD') // Fallback to USD
        }
      }
    }
  }, [value])

  const handleCurrencyChange = (currency: string) => {
    const currencyCode = currency as CurrencyCode
    
    // Only proceed if the currency is valid
    if (currencies[currencyCode]) {
      setSelectedCurrency(currencyCode)
      
      if (onValueChange) {
        onValueChange(currencyCode)
      } else {
        // If no onValueChange prop, save as user's default currency
        setUserCurrency(currencyCode)
      }
    }
  }

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency">
          {currencies[selectedCurrency] ? (
            <>
              {currencies[selectedCurrency].symbol} {currencies[selectedCurrency].code}
            </>
          ) : (
            'Select currency'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(currencies).map(([code, currency]) => (
          <SelectItem key={code} value={code}>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{currency.symbol}</span>
              <span>{currency.code}</span>
              <span className="text-muted-foreground">- {currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
