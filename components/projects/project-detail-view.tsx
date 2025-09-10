'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProjectEntryCard } from './project-entry-card'
import { ProjectEntryForm } from './project-entry-form'
import { ProjectExcelImport } from './project-excel-import'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, convertCurrency, type CurrencyCode } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowLeft, Receipt, FileSpreadsheet } from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

interface Project {
  id: string
  name: string
  budget: number
  spent: number
  currency: CurrencyCode
  created_at: string
}

interface ProjectEntry {
  id: string
  project_id: string
  date: string
  description: string
  amount: number
  currency: CurrencyCode
}

interface ProjectDetailViewProps {
  project: Project
  user: AuthUser
  isOpen: boolean
  onClose: () => void
  onProjectUpdate: () => void
}

const demoEntries: ProjectEntry[] = [
  { id: '1', project_id: '1', date: '2024-01-15', description: 'Paint and Supplies', amount: 450.00, currency: 'USD' },
  { id: '2', project_id: '1', date: '2024-01-12', description: 'Contractor Labor', amount: 1200.00, currency: 'USD' },
  { id: '3', project_id: '1', date: '2024-01-10', description: 'Tools Rental', amount: 180.50, currency: 'USD' },
  { id: '4', project_id: '2', date: '2024-01-08', description: 'Flight Booking', amount: 850.00, currency: 'USD' },
  { id: '5', project_id: '3', date: '2024-01-05', description: 'Initial Deposit', amount: 0.00, currency: 'USD' },
]

export function ProjectDetailView({ project, user, isOpen, onClose, onProjectUpdate }: ProjectDetailViewProps) {
  const { currency: globalCurrency } = useCurrency()
  const [entries, setEntries] = useState<ProjectEntry[]>([])
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ProjectEntry | null>(null)
  const [loading, setLoading] = useState(false)

  const loadProjectEntries = async () => {
    if (user.isDemo) {
      setEntries(demoEntries.filter(entry => entry.project_id === project.id))
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_entries')
        .select('*')
        .eq('project_id', project.id)
        .order('date', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading project entries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && project) {
      loadProjectEntries()
    }
  }, [isOpen, project.id, user.isDemo])

  const handleAddEntry = async (entryData: Omit<ProjectEntry, 'id'>) => {
    if (!user) return

    if (user.isDemo) {
      // Handle demo mode - add to local state only
      const newEntry: ProjectEntry = {
        id: `demo-${Date.now()}`,
        ...entryData
      }
      setEntries(prev => [newEntry, ...prev])
      onProjectUpdate()
      return
    }

    try {
      const { data, error } = await supabase
        .from('project_entries')
        .insert([entryData])
        .select()
        .single()

      if (error) throw error

      // Update project spent amount
      const convertedAmount = entryData.currency === project.currency 
        ? entryData.amount 
        : convertCurrency(entryData.amount, entryData.currency, project.currency)

      await supabase
        .from('projects')
        .update({ spent: project.spent + convertedAmount })
        .eq('id', project.id)

      setEntries(prev => [data, ...prev])
      onProjectUpdate()
    } catch (error) {
      console.error('Error adding project entry:', error)
    }
  }

  const handleEditEntry = async (entryData: Omit<ProjectEntry, 'id'>) => {
    if (!user || !editingEntry) return

    if (user.isDemo) {
      // Handle demo mode - update local state only
      const updatedEntry: ProjectEntry = {
        id: editingEntry.id,
        ...entryData
      }
      setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry))
      setEditingEntry(null)
      onProjectUpdate()
      return
    }

    try {
      const { data, error } = await supabase
        .from('project_entries')
        .update(entryData)
        .eq('id', editingEntry.id)
        .select()
        .single()

      if (error) throw error

      // Recalculate project spent amount
      const totalSpent = entries.reduce((sum, entry) => {
        if (entry.id === editingEntry.id) {
          // Use updated entry data
          const convertedAmount = entryData.currency === project.currency 
            ? entryData.amount 
            : convertCurrency(entryData.amount, entryData.currency, project.currency)
          return sum + convertedAmount
        } else {
          const convertedAmount = entry.currency === project.currency 
            ? entry.amount 
            : convertCurrency(entry.amount, entry.currency, project.currency)
          return sum + convertedAmount
        }
      }, 0)

      await supabase
        .from('projects')
        .update({ spent: totalSpent })
        .eq('id', project.id)

      setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? data : entry))
      setEditingEntry(null)
      onProjectUpdate()
    } catch (error) {
      console.error('Error updating project entry:', error)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this entry?')) return

    if (user.isDemo) {
      // Handle demo mode - remove from local state only
      setEntries(prev => prev.filter(entry => entry.id !== id))
      onProjectUpdate()
      return
    }

    try {
      const entryToDelete = entries.find(e => e.id === id)
      if (!entryToDelete) return

      const { error } = await supabase
        .from('project_entries')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update project spent amount
      const convertedAmount = entryToDelete.currency === project.currency 
        ? entryToDelete.amount 
        : convertCurrency(entryToDelete.amount, entryToDelete.currency, project.currency)

      await supabase
        .from('projects')
        .update({ spent: Math.max(0, project.spent - convertedAmount) })
        .eq('id', project.id)

      setEntries(prev => prev.filter(entry => entry.id !== id))
      onProjectUpdate()
    } catch (error) {
      console.error('Error deleting project entry:', error)
    }
  }

  const openEditForm = (entry: ProjectEntry) => {
    setEditingEntry(entry)
    setIsEntryFormOpen(true)
  }

  const closeForm = () => {
    setIsEntryFormOpen(false)
    setEditingEntry(null)
  }

  const handleBulkImport = async (importedEntries: any[]) => {
    if (!user) return

    if (user.isDemo) {
      // Handle demo mode - add to local state only
      const newEntries: ProjectEntry[] = importedEntries.map(entry => ({
        id: `demo-${Date.now()}-${Math.random()}`,
        ...entry
      }))
      setEntries(prev => [...newEntries, ...prev])
      onProjectUpdate()
      return
    }

    try {
      const { data, error } = await supabase
        .from('project_entries')
        .insert(importedEntries)
        .select()

      if (error) throw error

      // Calculate total amount to add to project spent
      const totalToAdd = importedEntries.reduce((sum, entry) => {
        const convertedAmount = entry.currency === project.currency 
          ? entry.amount 
          : convertCurrency(entry.amount, entry.currency, project.currency)
        return sum + convertedAmount
      }, 0)

      // Update project spent amount
      await supabase
        .from('projects')
        .update({ spent: project.spent + totalToAdd })
        .eq('id', project.id)

      // Add new entries to state
      if (data) {
        setEntries(prev => [...data, ...prev])
      }
      onProjectUpdate()
    } catch (error) {
      console.error('Error importing project entries:', error)
      throw error
    }
  }

  // Calculate totals in global currency
  const budgetInGlobalCurrency = project.currency === globalCurrency 
    ? project.budget 
    : convertCurrency(project.budget, project.currency, globalCurrency)

  const spentInGlobalCurrency = entries.reduce((sum, entry) => {
    const convertedAmount = entry.currency === globalCurrency 
      ? entry.amount 
      : convertCurrency(entry.amount, entry.currency, globalCurrency)
    return sum + convertedAmount
  }, 0)

  const progress = Math.min((spentInGlobalCurrency / budgetInGlobalCurrency) * 100, 100)
  const remaining = Math.max(budgetInGlobalCurrency - spentInGlobalCurrency, 0)
  const isOverBudget = spentInGlobalCurrency > budgetInGlobalCurrency

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <DialogDescription>Project details and expenses</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatCurrency(budgetInGlobalCurrency, globalCurrency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spent</p>
                  <p className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                    {formatCurrency(spentInGlobalCurrency, globalCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget 
                      ? `-${formatCurrency(spentInGlobalCurrency - budgetInGlobalCurrency, globalCurrency)}` 
                      : formatCurrency(remaining, globalCurrency)
                    }
                  </p>
                </div>
              </div>

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
            </CardContent>
          </Card>

          {/* Entries Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Project Entries ({entries.length})
              </h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsImportOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import Excel
                </Button>
                <Button 
                  onClick={() => setIsEntryFormOpen(true)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No entries yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking expenses for this project
                </p>
                <Button 
                  onClick={() => setIsEntryFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                <AnimatePresence>
                  {entries.map((entry) => (
                    <ProjectEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={openEditForm}
                      onDelete={handleDeleteEntry}
                      isDemo={user.isDemo}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Entry Form Modal */}
      <ProjectEntryForm
        projectId={project.id}
        projectName={project.name}
        entry={editingEntry}
        isOpen={isEntryFormOpen}
        onClose={closeForm}
        onSubmit={editingEntry ? handleEditEntry : handleAddEntry}
        isDemo={user.isDemo}
      />

      {/* Excel Import Modal */}
      <ProjectExcelImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        projectId={project.id}
        projectName={project.name}
        isDemo={user.isDemo}
      />
    </Dialog>
  )
}
