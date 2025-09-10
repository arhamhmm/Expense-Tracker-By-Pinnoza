'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface Group {
  id: string
  name: string
  created_at: string
  members?: GroupMember[]
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  balance: number
  user_email?: string
}

interface SharedExpenseFormProps {
  group: Group
  isOpen: boolean
  onClose: () => void
  onSubmit: (expense: { description: string, amount: number, paid_by: string }) => Promise<void>
  isDemo?: boolean
}

export function SharedExpenseForm({ group, isOpen, onClose, onSubmit, isDemo }: SharedExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paid_by: ''
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: '',
        amount: '',
        paid_by: ''
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      await onSubmit({
        description: formData.description,
        amount: parseFloat(formData.amount),
        paid_by: formData.paid_by
      })
      onClose()
    } catch (error) {
      console.error('Error submitting shared expense:', error)
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
          <DialogTitle>Add Shared Expense</DialogTitle>
          <DialogDescription>
            Add a new expense for {group.name} and split it among members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="paid_by">Paid By</Label>
            <Select
              value={formData.paid_by}
              onValueChange={(value) => handleInputChange('paid_by', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Who paid for this?" />
              </SelectTrigger>
              <SelectContent>
                {group.members?.map((member) => (
                  <SelectItem key={member.id} value={member.user_id}>
                    {member.user_email || `User ${member.user_id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
            This expense will be split equally among all {group.members?.length || 0} group members.
          </div>
          
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
