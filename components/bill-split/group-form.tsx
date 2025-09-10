'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, X, Plus } from 'lucide-react'

interface Group {
  id: string
  name: string
  created_at: string
}

interface GroupFormProps {
  group?: Group | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (group: { name: string, members: string[] }) => Promise<void>
  isDemo?: boolean
}

export function GroupForm({ group, isOpen, onClose, onSubmit, isDemo }: GroupFormProps) {
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<string[]>([''])

  useEffect(() => {
    if (group) {
      setGroupName(group.name)
      setMembers(['']) // For editing, we'll just allow adding new members
    } else {
      setGroupName('')
      setMembers([''])
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validMembers = members.filter(email => email.trim() !== '')
    
    setLoading(true)
    try {
      await onSubmit({
        name: groupName,
        members: validMembers
      })
      onClose()
    } catch (error) {
      console.error('Error submitting group:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMemberField = () => {
    setMembers(prev => [...prev, ''])
  }

  const removeMemberField = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, email: string) => {
    setMembers(prev => prev.map((member, i) => i === index ? email : member))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {group ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
          <DialogDescription>
            {group 
              ? 'Update your group details and add new members.' 
              : 'Create a new group to split expenses with friends.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              disabled={isDemo}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Members (Email Addresses)</Label>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    type="email"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                    placeholder="member@example.com"
                    className="flex-1"
                  />
                  {members.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMemberField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMemberField}
                disabled={isDemo}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add email addresses of people you want to split expenses with
            </p>
          </div>
          
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {group ? 'Update' : 'Create'} Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
