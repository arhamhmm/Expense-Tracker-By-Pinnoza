'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCategories, isCustomCategory } from '@/lib/category-context'
import { Plus, Trash2, Loader2 } from 'lucide-react'

export function CategoryManagement() {
  const { categories, categoryColors, addCategory, removeCategory, isLoading } = useCategories()
  const [newCategory, setNewCategory] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [removingCategory, setRemovingCategory] = useState<string | null>(null)

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    setIsAdding(true)
    try {
      await addCategory(newCategory.trim())
      setNewCategory('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category'
      alert(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to remove "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    setRemovingCategory(categoryName)
    try {
      await removeCategory(categoryName)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove category'
      alert(errorMessage)
    } finally {
      setRemovingCategory(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultCategories = categories.filter(cat => !isCustomCategory(cat))
  const customCategories = categories.filter(cat => isCustomCategory(cat))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Category Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add New Category</label>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAdding}
            />
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || isAdding}
              size="sm"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create your own categories to better organize your expenses
          </p>
        </div>

        {/* Default Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Default Categories</h4>
          <div className="flex flex-wrap gap-2">
            {defaultCategories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className={`${categoryColors[category] || 'bg-gray-100 text-gray-800'} border-0`}
              >
                {category}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Default categories cannot be removed
          </p>
        </div>

        {/* Custom Categories */}
        {customCategories.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Your Custom Categories</h4>
            <div className="flex flex-wrap gap-2">
              {customCategories.map((category) => (
                <div key={category} className="flex items-center space-x-1">
                  <Badge
                    className={`${categoryColors[category] || 'bg-gray-100 text-gray-800'} border-0`}
                  >
                    {category}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCategory(category)}
                    disabled={removingCategory === category}
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    {removingCategory === category ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {customCategories.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              No custom categories yet. Add your first one above!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
