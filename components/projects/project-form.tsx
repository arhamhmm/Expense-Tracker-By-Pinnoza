'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelector } from '@/components/ui/currency-selector'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getUserCurrency, type CurrencyCode } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  budget: number
  spent: number
  currency: CurrencyCode
  created_at: string
}

interface ProjectFormProps {
  project?: Project | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (project: { name: string; budget: number; spent: number; currency: CurrencyCode }) => Promise<void>
  isDemo?: boolean
}

export function ProjectForm({ project, isOpen, onClose, onSubmit, isDemo }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    spent: '',
    currency: 'USD' as CurrencyCode
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        budget: project.budget.toString(),
        spent: project.spent.toString(),
        currency: project.currency || 'USD'
      })
    } else {
      const userCurrency = typeof window !== 'undefined' ? getUserCurrency() : 'USD'
      setFormData({
        name: '',
        budget: '',
        spent: '0',
        currency: userCurrency
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemo) return

    setLoading(true)
    try {
      await onSubmit({
        name: formData.name,
        budget: parseFloat(formData.budget),
        spent: parseFloat(formData.spent),
        currency: formData.currency as CurrencyCode
      })
      onClose()
    } catch (error) {
      console.error('Error submitting project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Update your project details below.' 
              : 'Fill in the details for your new project.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              required
              disabled={isDemo}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="0.00"
              required
              disabled={isDemo}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spent">Amount Spent</Label>
              <Input
                id="spent"
                type="number"
                step="0.01"
                min="0"
                value={formData.spent}
                onChange={(e) => handleInputChange('spent', e.target.value)}
                placeholder="0.00"
                required
                disabled={isDemo}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelector
                value={formData.currency as CurrencyCode}
                onValueChange={(currency) => handleInputChange('currency', currency)}
                disabled={isDemo}
              />
            </div>
          </div>
          
          {isDemo && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              Demo mode: Project operations are disabled
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isDemo}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? 'Update' : 'Create'} Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
