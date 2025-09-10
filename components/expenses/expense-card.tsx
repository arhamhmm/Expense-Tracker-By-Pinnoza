'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, categoryColors, type CurrencyCode } from '@/lib/utils'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  currency: CurrencyCode
}

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  isDemo?: boolean
}

export function ExpenseCard({ expense, onEdit, onDelete, isDemo }: ExpenseCardProps) {
  const [isSwipeAction, setIsSwipeAction] = useState(false)

  const categoryColor = categoryColors[expense.category as keyof typeof categoryColors] || categoryColors.Other

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="touch-manipulation"
    >
      <Card className={`transition-all hover:shadow-md ${isSwipeAction ? 'swipe-card' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColor}`}>
                    {expense.category}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
              
              {/* Desktop actions */}
              <div className="hidden sm:flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(expense)}
                  disabled={isDemo}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(expense.id)}
                  disabled={isDemo}
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile dropdown */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onEdit(expense)}
                      disabled={isDemo}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(expense.id)}
                      disabled={isDemo}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
