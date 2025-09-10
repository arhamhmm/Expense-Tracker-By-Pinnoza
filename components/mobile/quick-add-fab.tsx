'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  X, 
  Send, 
  DollarSign,
  Utensils,
  Car,
  ShoppingCart,
  Home,
  Gamepad2,
  Heart,
  Briefcase,
  GraduationCap,
  MoreHorizontal
} from 'lucide-react'
import { categories, type CurrencyCode } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'

interface QuickExpense {
  amount: string
  category: string
  description: string
  currency: CurrencyCode
}

interface QuickAddFABProps {
  onAddExpense: (expense: Omit<QuickExpense, 'currency'> & { currency: CurrencyCode; date: string }) => Promise<void>
  isDemo?: boolean
}

const categoryIcons: Record<string, any> = {
  'Food': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingCart,
  'Housing': Home,
  'Entertainment': Gamepad2,
  'Healthcare': Heart,
  'Work': Briefcase,
  'Education': GraduationCap,
  'Other': MoreHorizontal
}

const quickAmounts = ['5', '10', '20', '50', '100']

export function QuickAddFAB({ onAddExpense, isDemo }: QuickAddFABProps) {
  const { currency: globalCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'amount' | 'category' | 'description'>('amount')
  const [loading, setLoading] = useState(false)
  const [expense, setExpense] = useState<QuickExpense>({
    amount: '',
    category: '',
    description: '',
    currency: globalCurrency
  })

  const handleQuickAmount = (amount: string) => {
    setExpense(prev => ({ ...prev, amount }))
    setStep('category')
  }

  const handleCategory = (category: string) => {
    setExpense(prev => ({ ...prev, category }))
    setStep('description')
  }

  const handleSubmit = async () => {
    if (!expense.amount || !expense.category || !expense.description) return

    setLoading(true)
    try {
      await onAddExpense({
        ...expense,
        date: new Date().toISOString().split('T')[0]
      })
      
      // Reset form
      setExpense({
        amount: '',
        category: '',
        description: '',
        currency: globalCurrency
      })
      setStep('amount')
      setIsOpen(false)
    } catch (error) {
      console.error('Error adding expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setExpense({
      amount: '',
      category: '',
      description: '',
      currency: globalCurrency
    })
    setStep('amount')
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 md:hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          disabled={isDemo}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetForm}
          >
            <motion.div
              className="w-full max-w-sm"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="rounded-t-3xl rounded-b-none border-0 shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Add Expense</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="flex justify-center space-x-2 mt-2">
                    {['amount', 'category', 'description'].map((s, index) => (
                      <div
                        key={s}
                        className={`h-2 w-8 rounded-full transition-colors ${
                          step === s ? 'bg-primary' : 
                          ['amount', 'category', 'description'].indexOf(step) > index ? 'bg-primary/50' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  {/* Step 1: Amount */}
                  {step === 'amount' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <DollarSign className="h-12 w-12 mx-auto text-primary mb-2" />
                        <h3 className="text-lg font-medium">How much?</h3>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            onClick={() => handleQuickAmount(amount)}
                            className="h-12"
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>

                      {/* Custom Amount */}
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Custom amount"
                          value={expense.amount}
                          onChange={(e) => setExpense(prev => ({ ...prev, amount: e.target.value }))}
                          className="text-center text-lg"
                        />
                        {expense.amount && (
                          <Button
                            onClick={() => setStep('category')}
                            className="w-full"
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Category */}
                  {step === 'category' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-medium">What category?</h3>
                        <p className="text-sm text-muted-foreground">${expense.amount}</p>
                      </div>

                      {/* Category Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {categories.slice(0, 9).map((category) => {
                          const Icon = categoryIcons[category] || MoreHorizontal
                          return (
                            <Button
                              key={category}
                              variant="outline"
                              onClick={() => handleCategory(category)}
                              className="h-16 flex flex-col gap-1"
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs">{category}</span>
                            </Button>
                          )
                        })}
                      </div>

                      {/* Back Button */}
                      <Button
                        variant="ghost"
                        onClick={() => setStep('amount')}
                        className="w-full"
                      >
                        Back
                      </Button>
                    </motion.div>
                  )}

                  {/* Step 3: Description */}
                  {step === 'description' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-medium">What for?</h3>
                        <p className="text-sm text-muted-foreground">
                          ${expense.amount} • {expense.category}
                        </p>
                      </div>

                      {/* Description Input */}
                      <div className="space-y-3">
                        <Input
                          placeholder="Enter description..."
                          value={expense.description}
                          onChange={(e) => setExpense(prev => ({ ...prev, description: e.target.value }))}
                          className="text-center"
                          autoFocus
                        />

                        {/* Quick Descriptions */}
                        <div className="space-y-1">
                          {getQuickDescriptions(expense.category).map((desc) => (
                            <Button
                              key={desc}
                              variant="ghost"
                              onClick={() => setExpense(prev => ({ ...prev, description: desc }))}
                              className="w-full justify-start text-sm h-8"
                            >
                              {desc}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setStep('category')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={!expense.description || loading}
                          className="flex-1"
                        >
                          {loading ? 'Adding...' : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {isDemo && step === 'description' && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md mt-3">
                      Demo mode: Expense will be added locally
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getQuickDescriptions(category: string): string[] {
  const descriptions: Record<string, string[]> = {
    'Food': ['Lunch', 'Dinner', 'Coffee', 'Groceries', 'Snacks'],
    'Transportation': ['Gas', 'Uber', 'Bus fare', 'Parking', 'Taxi'],
    'Shopping': ['Clothes', 'Electronics', 'Gifts', 'Home items', 'Personal care'],
    'Housing': ['Rent', 'Utilities', 'Internet', 'Repairs', 'Furniture'],
    'Entertainment': ['Movies', 'Games', 'Concert', 'Streaming', 'Sports'],
    'Healthcare': ['Doctor', 'Pharmacy', 'Dentist', 'Insurance', 'Vitamins'],
    'Work': ['Office supplies', 'Equipment', 'Travel', 'Meals', 'Software'],
    'Education': ['Books', 'Course', 'Supplies', 'Tuition', 'Training'],
    'Other': ['Miscellaneous', 'Emergency', 'Transfer', 'Fee', 'Service']
  }
  
  return descriptions[category] || descriptions['Other']
}
