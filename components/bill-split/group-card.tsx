'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, getInitials } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { Users, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface GroupCardProps {
  group: Group
  onEdit: (group: Group) => void
  onDelete: (id: string) => void
  onAddExpense: (group: Group) => void
  onViewDetails: (group: Group) => void
  isDemo?: boolean
}

export function GroupCard({ 
  group, 
  onEdit, 
  onDelete, 
  onAddExpense, 
  onViewDetails, 
  isDemo 
}: GroupCardProps) {
  const { currency: globalCurrency } = useCurrency()
  const memberCount = group.members?.length || 0
  const totalExpenses = group.shared_expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
  const recentExpense = group.shared_expenses?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full transition-all hover:shadow-lg cursor-pointer" onClick={() => onViewDetails(group)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate pr-2">
            {group.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onAddExpense(group)
                }}
                disabled={isDemo}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(group)
                }}
                disabled={isDemo}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(group.id)
                }}
                disabled={isDemo}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Members</p>
              <div className="flex items-center mt-1">
                <Users className="h-4 w-4 mr-1" />
                <span className="font-medium">{memberCount}</span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Total Spent</p>
              <p className="font-medium">{formatCurrency(totalExpenses, globalCurrency)}</p>
            </div>
          </div>

          {/* Member Avatars */}
          {group.members && group.members.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Members</p>
              <div className="flex -space-x-2">
                {group.members.slice(0, 4).map((member, index) => (
                  <div
                    key={member.id}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-white"
                    style={{ zIndex: group.members!.length - index }}
                  >
                    {getInitials(member.user_email || 'User')}
                  </div>
                ))}
                {memberCount > 4 && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white">
                    +{memberCount - 4}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Expense */}
          {recentExpense && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Recent Expense</p>
              <div className="flex justify-between items-center">
                <span className="text-sm truncate">{recentExpense.description}</span>
                <span className="text-sm font-medium">{formatCurrency(recentExpense.amount, globalCurrency)}</span>
              </div>
            </div>
          )}

          {/* Balances Preview */}
          {group.members && group.members.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Balances</p>
              <div className="space-y-1">
                {group.members.slice(0, 2).map((member) => (
                  <div key={member.id} className="flex justify-between items-center text-xs">
                    <span className="truncate">{member.user_email || 'User'}</span>
                    <span className={`font-medium ${
                      member.balance > 0 ? 'text-green-600' : member.balance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {member.balance > 0 ? '+' : ''}{formatCurrency(Math.abs(member.balance), globalCurrency)}
                    </span>
                  </div>
                ))}
                {memberCount > 2 && (
                  <p className="text-xs text-muted-foreground">+{memberCount - 2} more...</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onAddExpense(group)
              }}
              disabled={isDemo}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
