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

interface ProjectEntry {
  id: string
  project_id: string
  date: string
  description: string
  amount: number
  currency: CurrencyCode
}

interface ProjectEntryFormProps {
  projectId: string
  projectName: string
  entry?: ProjectEntry | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (entry: Omit<ProjectEntry, 'id'>) => Promise<void>
  isDemo?: boolean
}

export function ProjectEntryForm({ 
  projectId, 
  projectName, 
  entry, 
  isOpen, 
  onClose, 
  onSubmit, 
  isDemo 
}: ProjectEntryFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    amount: '',
    currency: 'USD' as CurrencyCode
  })

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        amount: entry.amount.toString(),
        currency: entry.currency || 'USD'
      })
    } else {
      const userCurrency = typeof window !== 'undefined' ? getUserCurrency() : 'USD'
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        currency: userCurrency
      })
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      await onSubmit({
        project_id: projectId,
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency as CurrencyCode
      })
      onClose()
    } catch (error) {
      console.error('Error submitting project entry:', error)
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
            {entry ? 'Edit Project Entry' : 'Add Project Entry'}
          </DialogTitle>
          <DialogDescription>
            {entry 
              ? `Update entry for ${projectName}` 
              : `Add a new expense entry to ${projectName}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What was this expense for?"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelector
                value={formData.currency as CurrencyCode}
                onValueChange={(currency) => handleInputChange('currency', currency)}
              />
            </div>
          </div>
          
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entry ? 'Update' : 'Add'} Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
