import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CurrencyProvider } from '@/lib/currency-context'
import { CategoryProvider } from '@/lib/category-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Expense Tracker',
  description: 'Track your expenses, manage projects, and split bills with ease',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Expense Tracker'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{position: 'fixed', bottom: 12, right: 12, zIndex: 9999, pointerEvents: 'none', opacity: 0.18, fontSize: 14, fontWeight: 600, color: '#3b82f6', userSelect: 'none', textShadow: '0 1px 4px #fff'}}>arham saeed</div>
        <CurrencyProvider>
          <CategoryProvider>
            {children}
          </CategoryProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
