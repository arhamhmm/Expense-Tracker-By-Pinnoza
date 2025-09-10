'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/ui/summary-card'
import { GroupCard } from '@/components/bill-split/group-card'
import { GroupForm } from '@/components/bill-split/group-form'
import { SharedExpenseForm } from '@/components/bill-split/expense-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { 
  Plus, 
  Search, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Receipt
} from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

interface Group {
  id: string
  name: string
  created_at: string
  members?: GroupMember[]
  shared_expenses?: SharedExpense[]
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  balance: number
  user_email?: string
}

interface SharedExpense {
  id: string
  group_id: string
  description: string
  amount: number
  paid_by: string
  created_at: string
}

const demoGroups: Group[] = [
  {
    id: '1',
    name: 'Roommates',
    created_at: '2024-01-01T00:00:00Z',
    members: [
      { id: '1', group_id: '1', user_id: 'user1', balance: 25.50, user_email: 'alice@example.com' },
      { id: '2', group_id: '1', user_id: 'user2', balance: -25.50, user_email: 'bob@example.com' }
    ],
    shared_expenses: [
      { id: '1', group_id: '1', description: 'Groceries', amount: 51.00, paid_by: 'user1', created_at: '2024-01-15T00:00:00Z' }
    ]
  },
  {
    id: '2',
    name: 'Trip to Vegas',
    created_at: '2024-01-05T00:00:00Z',
    members: [
      { id: '3', group_id: '2', user_id: 'user1', balance: 150.00, user_email: 'alice@example.com' },
      { id: '4', group_id: '2', user_id: 'user3', balance: -75.00, user_email: 'charlie@example.com' },
      { id: '5', group_id: '2', user_id: 'user4', balance: -75.00, user_email: 'diana@example.com' }
    ],
    shared_expenses: [
      { id: '2', group_id: '2', description: 'Hotel Room', amount: 300.00, paid_by: 'user1', created_at: '2024-01-10T00:00:00Z' },
      { id: '3', group_id: '2', description: 'Dinner', amount: 150.00, paid_by: 'user1', created_at: '2024-01-12T00:00:00Z' }
    ]
  }
]

export default function BillSplitPage() {
  const { currency: globalCurrency } = useCurrency()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false)
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<Group | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)
      await loadGroups(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Filter groups
    let filtered = groups

    if (searchTerm) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredGroups(filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }, [groups, searchTerm])

  const loadGroups = async (user: AuthUser) => {
    if (user.isDemo) {
      setGroups(demoGroups)
      return
    }

    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          members:group_members(*),
          shared_expenses(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (groupsError) throw groupsError

      // Transform the data to match our interface
      const transformedGroups = groupsData?.map(group => ({
        ...group,
        members: group.members || [],
        shared_expenses: (group.shared_expenses || []).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })) || []

      setGroups(transformedGroups)
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleCreateGroup = async (groupData: { name: string, members: string[] }) => {
    if (!user) return

    if (user.isDemo) {
      // Handle demo mode - add to local state
      const newGroup: Group = {
        id: `demo-${Date.now()}`,
        name: groupData.name,
        created_at: new Date().toISOString(),
        members: groupData.members.map((email, index) => ({
          id: `demo-member-${Date.now()}-${index}`,
          group_id: `demo-${Date.now()}`,
          user_id: email,
          balance: 0,
          user_email: email
        })),
        shared_expenses: []
      }
      setGroups(prev => [newGroup, ...prev])
      return
    }

    try {
      // Create group
      const { data: groupResult, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: groupData.name, user_id: user.id }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add members
      if (groupData.members.length > 0) {
        const memberInserts = groupData.members.map(email => ({
          group_id: groupResult.id,
          user_id: email, // In a real app, you'd look up user IDs by email
          balance: 0
        }))

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(memberInserts)

        if (membersError) throw membersError
      }

      // Reload groups
      await loadGroups(user)
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const handleEditGroup = async (groupData: { name: string, members: string[] }) => {
    if (!user || !editingGroup || user.isDemo) return

    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: groupData.name })
        .eq('id', editingGroup.id)

      if (error) throw error

      // Add new members if provided
      if (groupData.members.length > 0) {
        const memberInserts = groupData.members.map(email => ({
          group_id: editingGroup.id,
          user_id: email,
          balance: 0
        }))

        await supabase
          .from('group_members')
          .insert(memberInserts)
      }

      setEditingGroup(null)
      await loadGroups(user)
    } catch (error) {
      console.error('Error updating group:', error)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!user || user.isDemo) return

    if (!confirm('Are you sure you want to delete this group? This will also delete all associated expenses.')) return

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadGroups(user)
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  const handleAddSharedExpense = async (expenseData: { description: string, amount: number, paid_by: string }) => {
    if (!user || !selectedGroup || user.isDemo) return

    try {
      // Add shared expense
      const { error: expenseError } = await supabase
        .from('shared_expenses')
        .insert([{
          group_id: selectedGroup.id,
          description: expenseData.description,
          amount: expenseData.amount,
          paid_by: expenseData.paid_by
        }])

      if (expenseError) throw expenseError

      // Update member balances
      const memberCount = selectedGroup.members?.length || 1
      const amountPerPerson = expenseData.amount / memberCount

      if (selectedGroup.members) {
        for (const member of selectedGroup.members) {
          const balanceChange = member.user_id === expenseData.paid_by 
            ? expenseData.amount - amountPerPerson  // Payer gets credit
            : -amountPerPerson  // Others owe money

          await supabase
            .from('group_members')
            .update({ balance: member.balance + balanceChange })
            .eq('id', member.id)
        }
      }

      await loadGroups(user)
    } catch (error) {
      console.error('Error adding shared expense:', error)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  const openEditForm = (group: Group) => {
    setEditingGroup(group)
    setIsGroupFormOpen(true)
  }

  const openExpenseForm = (group: Group) => {
    setSelectedGroup(group)
    setIsExpenseFormOpen(true)
  }

  const openGroupDetails = (group: Group) => {
    setSelectedGroupDetails(group)
  }

  const closeGroupForm = () => {
    setIsGroupFormOpen(false)
    setEditingGroup(null)
  }

  const closeExpenseForm = () => {
    setIsExpenseFormOpen(false)
    setSelectedGroup(null)
  }

  // Calculate summary stats
  const totalGroups = groups.length
  const totalMembers = groups.reduce((sum, group) => sum + (group.members?.length || 0), 0)
  const totalSharedExpenses = groups.reduce((sum, group) => 
    sum + (group.shared_expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0), 0
  )
  const yourBalance = groups.reduce((sum, group) => {
    const yourMembership = group.members?.find(m => m.user_id === user?.id)
    return sum + (yourMembership?.balance || 0)
  }, 0)

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
            <h1 className="text-3xl font-bold">Bill Split</h1>
            <p className="text-muted-foreground mt-2">
              Share expenses and settle up with friends
            </p>
          </div>
          <Button 
            onClick={() => setIsGroupFormOpen(true)}
            disabled={user.isDemo}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Groups"
            value={totalGroups.toString()}
            description="Active groups"
            icon={Users}
          />
          <SummaryCard
            title="Total Members"
            value={totalMembers.toString()}
            description="Across all groups"
            icon={Users}
          />
          <SummaryCard
            title="Shared Expenses"
            value={formatCurrency(totalSharedExpenses, globalCurrency)}
            description="Total group spending"
            icon={Receipt}
          />
          <SummaryCard
            title="Your Balance"
            value={formatCurrency(Math.abs(yourBalance), globalCurrency)}
            description={yourBalance >= 0 ? "You are owed" : "You owe"}
            icon={yourBalance >= 0 ? TrendingUp : DollarSign}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Groups Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Your Groups ({filteredGroups.length})
          </h2>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first group to start splitting expenses with friends'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsGroupFormOpen(true)}
                  disabled={user.isDemo}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onEdit={openEditForm}
                    onDelete={handleDeleteGroup}
                    onAddExpense={openExpenseForm}
                    onViewDetails={openGroupDetails}
                    isDemo={user.isDemo}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {groups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Shared Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groups
                    .flatMap(group => 
                      (group.shared_expenses || []).map(expense => ({
                        ...expense,
                        groupName: group.name
                      }))
                    )
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.groupName} • {formatDate(expense.created_at)}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(expense.amount, globalCurrency)}</span>
                      </div>
                    ))}
                  {groups.every(group => !group.shared_expenses || group.shared_expenses.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">
                      No shared expenses yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Floating Add Button (Mobile) */}
        <div className="fixed bottom-20 right-4 sm:hidden">
          <Button
            size="lg"
            onClick={() => setIsGroupFormOpen(true)}
            disabled={user.isDemo}
            className="rounded-full h-14 w-14 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Group Form Modal */}
      <GroupForm
        group={editingGroup}
        isOpen={isGroupFormOpen}
        onClose={closeGroupForm}
        onSubmit={editingGroup ? handleEditGroup : handleCreateGroup}
        isDemo={user.isDemo}
      />

      {/* Shared Expense Form Modal */}
      {selectedGroup && (
        <SharedExpenseForm
          group={selectedGroup}
          isOpen={isExpenseFormOpen}
          onClose={closeExpenseForm}
          onSubmit={handleAddSharedExpense}
          isDemo={user.isDemo}
        />
      )}
    </MainLayout>
  )
}
