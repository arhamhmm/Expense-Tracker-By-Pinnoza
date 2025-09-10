import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const currencies = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', code: 'PKR' },
}

export type CurrencyCode = keyof typeof currencies

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'PKR' ? 0 : 2,
    maximumFractionDigits: currency === 'PKR' ? 0 : 2,
  }).format(amount)
}

// Exchange rates (in a real app, you'd fetch these from an API)
export const exchangeRates: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.85,
  CAD: 1.25,
  PKR: 280,
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / exchangeRates[from]
  return usdAmount * exchangeRates[to]
}

export function getUserCurrency(): CurrencyCode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user-currency')
    if (stored && stored in currencies) {
      return stored as CurrencyCode
    }
  }
  return 'USD'
}

export function setUserCurrency(currency: CurrencyCode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-currency', currency)
  }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const categories = [
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

export const categoryColors = {
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
