'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Receipt, 
  FolderOpen, 
  Users, 
  LogOut, 
  Menu,
  X,
  User,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

interface SidebarProps {
  user: AuthUser
  onSignOut: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Bill Split', href: '/bill-split', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10">
            <Image
              src="/logo.png"
              alt="Expense Tracker Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-primary">Smart Expense</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email || 'User'}</p>
            {user?.isDemo && (
              <p className="text-xs text-orange-600 font-medium">Demo Account</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-6 py-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile header with logo and menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="Expense Tracker Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-primary">Smart Expense</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r lg:hidden"
          >
            <SidebarContent />
          </motion.div>
        </>
      )}

      {/* Enhanced Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 safe-area-inset-bottom">
        <div className="flex justify-around py-2 px-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 min-w-0 flex-1',
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                <item.icon className={cn(
                  'mb-1 transition-all duration-200',
                  isActive ? 'h-6 w-6' : 'h-5 w-5'
                )} />
                <span className="truncate leading-tight">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
