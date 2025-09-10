'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/ui/summary-card'
import { ExpenseCharts } from '@/components/ui/expense-charts'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, getUserCurrency, convertCurrency, type CurrencyCode } from '@/lib/utils'
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  FolderOpen, 
  Users,
  Calendar
} from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('USD')
  const [stats, setStats] = useState({
    totalSpent: 0,
    monthlySpent: 0,
    expenseCount: 0,
    projectCount: 0,
    groupCount: 0,
    topCategory: 'N/A'
  })
  const [chartData, setChartData] = useState({
    categoryData: [] as { name: string; value: number }[],
    monthlyData: [] as { name: string; value: number }[],
    weeklyData: [] as { name: string; value: number }[]
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)
      setUserCurrency(getUserCurrency())
      await loadDashboardStats(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadDashboardStats = async (user: AuthUser) => {
    if (user.isDemo) {
      // Demo data
      setStats({
        totalSpent: 2847.50,
        monthlySpent: 1234.75,
        expenseCount: 47,
        projectCount: 3,
        groupCount: 2,
        topCategory: 'Food & Dining'
      })
      
      // Demo chart data
      setChartData({
        categoryData: [
          { name: 'Food & Dining', value: 856 },
          { name: 'Transportation', value: 432 },
          { name: 'Shopping', value: 321 },
          { name: 'Entertainment', value: 268 },
          { name: 'Bills & Utilities', value: 195 },
          { name: 'Healthcare', value: 142 }
        ],
        monthlyData: [
          { name: 'Jan', value: 1200 },
          { name: 'Feb', value: 1456 },
          { name: 'Mar', value: 1789 },
          { name: 'Apr', value: 1234 },
          { name: 'May', value: 1567 },
          { name: 'Jun', value: 1890 }
        ],
        weeklyData: [
          { name: 'Mon', value: 45 },
          { name: 'Tue', value: 67 },
          { name: 'Wed', value: 32 },
          { name: 'Thu', value: 89 },
          { name: 'Fri', value: 156 },
          { name: 'Sat', value: 234 },
          { name: 'Sun', value: 123 }
        ]
      })
      return
    }

    try {
      // Get current month date range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, date')
        .eq('user_id', user.id)

      // Fetch monthly expenses
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)

      // Fetch groups
      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .eq('user_id', user.id)

      // Calculate stats
      const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const monthlySpent = monthlyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const expenseCount = expenses?.length || 0
      const projectCount = projects?.length || 0
      const groupCount = groups?.length || 0

      // Find top category
      const categoryTotals: { [key: string]: number } = {}
      expenses?.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
      })
      const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, 'N/A'
      )

      setStats({
        totalSpent,
        monthlySpent,
        expenseCount,
        projectCount,
        groupCount,
        topCategory
      })

      // Generate chart data
      const categoryData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      // Generate monthly data (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString()
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString()
        
        const monthExpenses = expenses?.filter(exp => 
          exp.date >= monthStart && exp.date <= monthEnd
        ) || []
        
        return {
          name: monthNames[monthDate.getMonth()],
          value: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        }
      })

      // Generate weekly data (last 7 days)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).toISOString()
        const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() + 1).toISOString()
        
        const dayExpenses = expenses?.filter(exp => 
          exp.date >= dayStart && exp.date < dayEnd
        ) || []
        
        return {
          name: dayNames[dayDate.getDay()],
          value: dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        }
      })

      setChartData({
        categoryData,
        monthlyData,
        weeklyData
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Spent"
            value={formatCurrency(stats.totalSpent, userCurrency)}
            description="All time expenses"
            icon={DollarSign}
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(stats.monthlySpent, userCurrency)}
            description="Current month spending"
            icon={Calendar}
            trend={{ value: 12.5, isPositive: false }}
          />
          <SummaryCard
            title="Expenses"
            value={stats.expenseCount.toString()}
            description="Total expense entries"
            icon={Receipt}
          />
          <SummaryCard
            title="Projects"
            value={stats.projectCount.toString()}
            description="Active projects"
            icon={FolderOpen}
          />
          <SummaryCard
            title="Groups"
            value={stats.groupCount.toString()}
            description="Bill split groups"
            icon={Users}
          />
          <SummaryCard
            title="Top Category"
            value={stats.topCategory}
            description="Highest spending category"
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <ExpenseCharts 
          categoryData={chartData.categoryData}
          monthlyData={chartData.monthlyData}
          weeklyData={chartData.weeklyData}
        />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <div 
            className="p-6 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/expenses')}
          >
            <Receipt className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Track Expenses</h3>
            <p className="text-sm text-muted-foreground">Add and manage your daily expenses</p>
          </div>
          <div 
            className="p-6 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/projects')}
          >
            <FolderOpen className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Manage Projects</h3>
            <p className="text-sm text-muted-foreground">Track project budgets and spending</p>
          </div>
          <div 
            className="p-6 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/bill-split')}
          >
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Split Bills</h3>
            <p className="text-sm text-muted-foreground">Share expenses with friends</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
