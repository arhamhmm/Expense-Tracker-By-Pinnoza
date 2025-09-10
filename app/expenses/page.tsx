'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/ui/summary-card'
import { ExpenseCard } from '@/components/expenses/expense-card'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExcelImport } from '@/components/expenses/excel-import'
import { QuickAddFAB } from '@/components/mobile/quick-add-fab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencySelector } from '@/components/ui/currency-selector'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, categories, categoryColors, convertCurrency, type CurrencyCode } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Receipt,
  Calendar,
  Edit,
  Trash2,
  FileSpreadsheet
} from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  currency: CurrencyCode
}

const demoExpenses: Expense[] = [
  { id: '1', date: '2024-01-15', category: 'Food & Dining', description: 'Lunch at Restaurant', amount: 25.50, currency: 'USD' },
  { id: '2', date: '2024-01-14', category: 'Transportation', description: 'Gas Station', amount: 45.00, currency: 'USD' },
  { id: '3', date: '2024-01-13', category: 'Shopping', description: 'Grocery Shopping', amount: 120.75, currency: 'USD' },
  { id: '4', date: '2024-01-12', category: 'Entertainment', description: 'Movie Tickets', amount: 32.00, currency: 'USD' },
  { id: '5', date: '2024-01-11', category: 'Bills & Utilities', description: 'Electric Bill', amount: 89.25, currency: 'USD' },
  { id: '6', date: '2024-01-10', category: 'Food & Dining', description: 'Coffee Shop', amount: 1200, currency: 'PKR' },
  { id: '7', date: '2024-01-09', category: 'Transportation', description: 'Taxi Ride', amount: 15.50, currency: 'CAD' },
  { id: '8', date: '2024-01-08', category: 'Shopping', description: 'Online Purchase', amount: 85.00, currency: 'EUR' },
]

export default function ExpensesPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const { currency: userCurrency, setCurrency: setUserCurrency } = useCurrency()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)
      await loadExpenses(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Detect screen size for view mode
    const handleResize = () => {
      setViewMode(window.innerWidth >= 768 ? 'table' : 'cards')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Filter expenses
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === filterDate.getMonth() &&
               expenseDate.getFullYear() === filterDate.getFullYear()
      })
    }

    setFilteredExpenses(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }, [expenses, searchTerm, categoryFilter, dateFilter])

  const loadExpenses = async (user: AuthUser) => {
    if (user.isDemo) {
      setExpenses(demoExpenses)
      return
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
    }
  }

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user || user.isDemo) return

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expenseData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setExpenses(prev => [data, ...prev])
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleEditExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user || !editingExpense || user.isDemo) return

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', editingExpense.id)
        .select()
        .single()

      if (error) throw error
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? data : exp))
      setEditingExpense(null)
    } catch (error) {
      console.error('Error updating expense:', error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this expense?')) return

    if (user.isDemo) {
      // Handle demo mode - remove from local state only
      setExpenses(prev => prev.filter(expense => expense.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      setExpenses(prev => prev.filter(exp => exp.id !== id))
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleBulkImport = async (importedExpenses: any[]) => {
    if (!user) return

    if (user.isDemo) {
      // Handle demo mode - add to local state only
      const newExpenses: Expense[] = importedExpenses.map(expense => ({
        id: `demo-${Date.now()}-${Math.random()}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        ...expense
      }))
      setExpenses(prev => [...newExpenses, ...prev])
      return
    }

    try {
      const expensesToInsert = importedExpenses.map(expense => ({
        ...expense,
        user_id: user.id
      }))

      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select()

      if (error) throw error

      // Add new expenses to state
      if (data) {
        setExpenses(prev => [...data, ...prev])
      }
    } catch (error) {
      console.error('Error importing expenses:', error)
      throw error
    }
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingExpense(null)
  }

  // Calculate summary stats (convert all to user's preferred currency)
  const totalSpent = expenses.reduce((sum, exp) => {
    const convertedAmount = exp.currency === userCurrency 
      ? exp.amount 
      : convertCurrency(exp.amount, exp.currency, userCurrency)
    return sum + convertedAmount
  }, 0)
  
  const thisMonthSpent = expenses
    .filter(exp => {
      const expDate = new Date(exp.date)
      const now = new Date()
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, exp) => {
      const convertedAmount = exp.currency === userCurrency 
        ? exp.amount 
        : convertCurrency(exp.amount, exp.currency, userCurrency)
      return sum + convertedAmount
    }, 0)

  const categoryTotals: { [key: string]: number } = {}
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
  })
  const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
    categoryTotals[a] > categoryTotals[b] ? a : b, 'N/A'
  )

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your daily expenses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <CurrencySelector
              value={userCurrency}
              onValueChange={setUserCurrency}
              className="w-full sm:w-[140px]"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setIsFormOpen(true)}
                disabled={user.isDemo}
                className="flex-1 sm:flex-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
              <Button 
                onClick={() => setIsImportOpen(true)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total Spent"
            value={formatCurrency(totalSpent, userCurrency)}
            description="All time expenses"
            icon={DollarSign}
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(thisMonthSpent, userCurrency)}
            description="Current month spending"
            icon={Calendar}
          />
          <SummaryCard
            title="Top Category"
            value={topCategory}
            description="Highest spending category"
            icon={TrendingUp}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-[160px]"
          />
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Recent Expenses ({filteredExpenses.length})
            </h2>
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter || dateFilter
                  ? 'Try adjusting your filters'
                  : 'Start tracking your expenses by adding your first entry'
                }
              </p>
              {!searchTerm && !categoryFilter && !dateFilter && (
                <Button 
                  onClick={() => setIsFormOpen(true)}
                  disabled={user.isDemo}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Expense
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile/Card View */}
              {viewMode === 'cards' && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onEdit={openEditForm}
                        onDelete={handleDeleteExpense}
                        isDemo={user.isDemo}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Desktop/Table View */}
              {viewMode === 'table' && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredExpenses.map((expense) => {
                          const categoryColor = categoryColors[expense.category as keyof typeof categoryColors] || categoryColors.Other
                          return (
                            <motion.tr
                              key={expense.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>{formatDate(expense.date)}</TableCell>
                              <TableCell className="font-medium">{expense.description}</TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColor}`}>
                                  {expense.category}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(expense.amount, expense.currency)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditForm(expense)}
                                    disabled={user.isDemo}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    disabled={user.isDemo}
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Add Button (Mobile) */}
        <div className="fixed bottom-20 right-4 sm:hidden">
          <Button
            size="lg"
            onClick={() => setIsFormOpen(true)}
            disabled={user.isDemo}
            className="rounded-full h-14 w-14 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Expense Form Modal */}
      <ExpenseForm
        expense={editingExpense}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        isDemo={user.isDemo}
      />

      <ExcelImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        isDemo={user.isDemo}
      />

      <QuickAddFAB
        onAddExpense={handleAddExpense}
        isDemo={user.isDemo}
      />
    </MainLayout>
  )
}
