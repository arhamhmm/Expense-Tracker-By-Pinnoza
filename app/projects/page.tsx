'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { SummaryCard } from '@/components/ui/summary-card'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectForm } from '@/components/projects/project-form'
import { ProjectDetailView } from '@/components/projects/project-detail-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency, convertCurrency, type CurrencyCode } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'
import { 
  Plus, 
  Search, 
  FolderOpen, 
  DollarSign, 
  TrendingUp, 
  Target
} from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

interface Project {
  id: string
  name: string
  budget: number
  spent: number
  currency: CurrencyCode
  created_at: string
}

const demoProjects: Project[] = [
  { 
    id: '1', 
    name: 'Home Renovation', 
    budget: 5000, 
    spent: 3250, 
    currency: 'USD',
    created_at: '2024-01-01T00:00:00Z' 
  },
  { 
    id: '2', 
    name: 'Vacation Fund', 
    budget: 2000, 
    spent: 850, 
    currency: 'USD',
    created_at: '2024-01-05T00:00:00Z' 
  },
  { 
    id: '3', 
    name: 'Emergency Fund', 
    budget: 10000, 
    spent: 0, 
    currency: 'USD',
    created_at: '2024-01-10T00:00:00Z' 
  },
]

export default function ProjectsPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { currency: globalCurrency } = useCurrency()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }
      setUser(currentUser)
      await loadProjects(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Filter projects
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProjects(filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
  }, [projects, searchTerm])

  const loadProjects = async (user: AuthUser) => {
    if (user.isDemo) {
      setProjects(demoProjects)
      return
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (!user || user.isDemo) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setProjects(prev => [data, ...prev])
    } catch (error) {
      console.error('Error adding project:', error)
    }
  }

  const handleEditProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (!user || !editingProject || user.isDemo) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id)
        .select()
        .single()

      if (error) throw error
      setProjects(prev => prev.map(proj => proj.id === editingProject.id ? data : proj))
      setEditingProject(null)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!user || user.isDemo) return

    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProjects(prev => prev.filter(proj => proj.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  const openEditForm = (project: Project) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProject(null)
  }

  // Calculate summary stats in global currency
  const totalBudget = projects.reduce((sum, proj) => {
    const convertedBudget = proj.currency === globalCurrency 
      ? proj.budget 
      : convertCurrency(proj.budget, proj.currency, globalCurrency)
    return sum + convertedBudget
  }, 0)
  
  const totalSpent = projects.reduce((sum, proj) => {
    const convertedSpent = proj.currency === globalCurrency 
      ? proj.spent 
      : convertCurrency(proj.spent, proj.currency, globalCurrency)
    return sum + convertedSpent
  }, 0)
  
  const totalRemaining = totalBudget - totalSpent
  const overBudgetCount = projects.filter(proj => proj.spent > proj.budget).length

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
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Track budgets and spending for your projects
            </p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            disabled={user.isDemo}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Budget"
            value={formatCurrency(totalBudget, globalCurrency)}
            description="All project budgets"
            icon={Target}
          />
          <SummaryCard
            title="Total Spent"
            value={formatCurrency(totalSpent, globalCurrency)}
            description="Total project spending"
            icon={DollarSign}
          />
          <SummaryCard
            title="Remaining"
            value={formatCurrency(totalRemaining, globalCurrency)}
            description="Budget remaining"
            icon={TrendingUp}
          />
          <SummaryCard
            title="Projects"
            value={projects.length.toString()}
            description={`${overBudgetCount} over budget`}
            icon={FolderOpen}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Your Projects ({filteredProjects.length})
          </h2>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first project to start tracking budgets and spending'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsFormOpen(true)}
                  disabled={user.isDemo}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={openEditForm}
                    onDelete={handleDeleteProject}
                    onViewDetails={() => setSelectedProject(project)}
                    isDemo={user.isDemo}
                  />
                ))}
              </AnimatePresence>
            </div>
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

      {/* Project Form Modal */}
      <ProjectForm
        project={editingProject}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingProject ? handleEditProject : handleAddProject}
        isDemo={user.isDemo}
      />

      {/* Project Detail View */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          user={user}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdate={async () => {
            await loadProjects(user)
            // Update the selected project with fresh data
            const updatedProject = projects.find(p => p.id === selectedProject.id)
            if (updatedProject) {
              setSelectedProject(updatedProject)
            }
          }}
        />
      )}
    </MainLayout>
  )
}
