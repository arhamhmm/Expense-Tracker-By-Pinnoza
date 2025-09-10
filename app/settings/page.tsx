'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { CategoryManagement } from '@/components/ui/category-management'
import { getCurrentUser } from '@/lib/auth'
import { useCurrency } from '@/lib/currency-context'
import { Settings, Globe, Palette, Bell, Shield, User, Tags } from 'lucide-react'
import type { AuthUser } from '@/lib/auth'
import type { CurrencyCode } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const { currency, setCurrency } = useCurrency()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency)
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <MainLayout user={user} onSignOut={handleSignOut}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Currency Settings */}
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Currency</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Currency</label>
                <CurrencySelector
                  value={currency}
                  onValueChange={handleCurrencyChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This currency will be used throughout the application for displaying amounts.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Management */}
          <div className="col-span-full">
            <CategoryManagement />
          </div>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="text-sm text-gray-600">
                  {user.isDemo ? 'demo@expense-tracker.com' : user.email}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <div className="text-sm text-gray-600">
                  {user.isDemo ? 'Demo Account' : 'Regular Account'}
                </div>
              </div>
              {user.isDemo && (
                <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded-md">
                  You're using a demo account. Changes are saved locally and will be reset when you refresh the page.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <div className="text-sm text-gray-600">Light Mode</div>
                <p className="text-xs text-muted-foreground">
                  Dark mode coming soon!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Storage</label>
                <div className="text-sm text-gray-600">
                  {user.isDemo ? 'Local Storage (Demo)' : 'Supabase Cloud'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Authentication</label>
                <div className="text-sm text-gray-600">
                  {user.isDemo ? 'Demo Mode' : 'Supabase Auth'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Notifications</label>
                <div className="text-sm text-gray-600">Disabled</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Push Notifications</label>
                <div className="text-sm text-gray-600">Disabled</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Notification settings coming soon!
              </p>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Application</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Version</label>
                <div className="text-sm text-gray-600">1.0.0</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Framework</label>
                <div className="text-sm text-gray-600">Next.js 14</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Database</label>
                <div className="text-sm text-gray-600">
                  {user.isDemo ? 'Local Demo Data' : 'Supabase'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Settings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Currency</label>
                <div className="text-lg font-semibold">{currency}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <div className="text-lg font-semibold">
                  {user.isDemo ? 'Demo' : 'Regular'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Data Storage</label>
                <div className="text-lg font-semibold">
                  {user.isDemo ? 'Local' : 'Cloud'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

