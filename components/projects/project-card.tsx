'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, type CurrencyCode } from '@/lib/utils'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Project {
  id: string
  name: string
  budget: number
  spent: number
  currency: CurrencyCode
  created_at: string
}

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onViewDetails?: (project: Project) => void
  isDemo?: boolean
}

export function ProjectCard({ project, onEdit, onDelete, onViewDetails, isDemo }: ProjectCardProps) {
  const progress = Math.min((project.spent / project.budget) * 100, 100)
  const remaining = Math.max(project.budget - project.spent, 0)
  const isOverBudget = project.spent > project.budget

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full transition-all hover:shadow-lg cursor-pointer" 
        onClick={() => onViewDetails?.(project)}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold truncate pr-2">
            {project.name}
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
                  onEdit(project)
                }}
                disabled={isDemo}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project.id)
                }}
                disabled={isDemo}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium">{formatCurrency(project.budget, project.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                {formatCurrency(project.spent, project.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {isOverBudget ? `-${formatCurrency(project.spent - project.budget, project.currency)}` : formatCurrency(remaining, project.currency)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
            />
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                isOverBudget
                  ? 'bg-red-100 text-red-800'
                  : progress >= 80
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {isOverBudget
                ? 'Over Budget'
                : progress >= 80
                ? 'Near Budget'
                : 'On Track'
              }
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
