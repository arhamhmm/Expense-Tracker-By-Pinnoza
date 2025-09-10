'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X
} from 'lucide-react'
import { formatCurrency, categories, type CurrencyCode } from '@/lib/utils'
import { useCurrency } from '@/lib/currency-context'

interface ImportedExpense {
  date: string
  category: string
  description: string
  amount: number
  currency: CurrencyCode
  isValid: boolean
  errors: string[]
}

interface ExcelImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (expenses: Omit<ImportedExpense, 'isValid' | 'errors'>[]) => Promise<void>
  isDemo?: boolean
}

export function ExcelImport({ isOpen, onClose, onImport, isDemo }: ExcelImportProps) {
  const { currency: globalCurrency } = useCurrency()
  const [importedData, setImportedData] = useState<ImportedExpense[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [importProgress, setImportProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setCurrentStep('preview')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // Process the Excel data
      const processedData = processExcelData(jsonData as any[][])
      setImportedData(processedData)
    } catch (error) {
      console.error('Error processing Excel file:', error)
      alert('Error processing Excel file. Please check the format.')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const processExcelData = (data: any[][]): ImportedExpense[] => {
    if (data.length === 0) return []

    // Skip header row if it exists
    const startRow = isHeaderRow(data[0]) ? 1 : 0
    
    return data.slice(startRow).map((row, index) => {
      const expense: ImportedExpense = {
        date: '',
        category: '',
        description: '',
        amount: 0,
        currency: globalCurrency,
        isValid: true,
        errors: []
      }

      // Process each column (flexible mapping)
      if (row[0]) {
        // Date (first column)
        const dateValue = parseDate(row[0])
        if (dateValue) {
          expense.date = dateValue
        } else {
          expense.errors.push('Invalid date format')
          expense.isValid = false
        }
      } else {
        expense.errors.push('Date is required')
        expense.isValid = false
      }

      if (row[1]) {
        // Category (second column)
        const category = String(row[1]).trim()
        if (categories.includes(category)) {
          expense.category = category
        } else {
          // Try to find a close match
          const closeMatch = categories.find(cat => 
            cat.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase().includes(cat.toLowerCase())
          )
          if (closeMatch) {
            expense.category = closeMatch
          } else {
            expense.category = 'Other'
            expense.errors.push(`Category "${category}" not found, set to "Other"`)
          }
        }
      } else {
        expense.errors.push('Category is required')
        expense.isValid = false
      }

      if (row[2]) {
        // Description (third column)
        expense.description = String(row[2]).trim()
      } else {
        expense.errors.push('Description is required')
        expense.isValid = false
      }

      if (row[3]) {
        // Amount (fourth column)
        const amount = parseFloat(String(row[3]).replace(/[^\d.-]/g, ''))
        if (!isNaN(amount) && amount > 0) {
          expense.amount = amount
        } else {
          expense.errors.push('Invalid amount')
          expense.isValid = false
        }
      } else {
        expense.errors.push('Amount is required')
        expense.isValid = false
      }

      // Currency (fifth column, optional)
      if (row[4]) {
        const currencyCode = String(row[4]).trim().toUpperCase()
        if (['USD', 'EUR', 'CAD', 'PKR'].includes(currencyCode)) {
          expense.currency = currencyCode as CurrencyCode
        }
      }

      return expense
    }).filter((_, index) => index < 1000) // Limit to 1000 rows for performance
  }

  const isHeaderRow = (row: any[]): boolean => {
    const firstCell = String(row[0] || '').toLowerCase()
    return ['date', 'day', 'time', 'when'].some(header => firstCell.includes(header))
  }

  const parseDate = (value: any): string | null => {
    if (!value) return null

    // Handle Excel date numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
      }
    }

    // Handle string dates
    const dateStr = String(value)
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    // Try common date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    ]

    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        const [, p1, p2, p3] = match
        // Assume YYYY-MM-DD if year is first
        if (p1.length === 4) {
          return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`
        } else {
          // Assume MM/DD/YYYY format
          return `${p3}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`
        }
      }
    }

    return null
  }

  const handleImport = async () => {
    if (isDemo) {
      alert('Import functionality is disabled in demo mode')
      return
    }

    const validExpenses = importedData.filter(expense => expense.isValid)
    if (validExpenses.length === 0) {
      alert('No valid expenses to import')
      return
    }

    setCurrentStep('importing')
    setImportProgress(0)

    try {
      // Simulate progress for demo purposes
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      await onImport(validExpenses.map(({ isValid, errors, ...expense }) => expense))
      setCurrentStep('complete')
    } catch (error) {
      console.error('Error importing expenses:', error)
      alert('Error importing expenses. Please try again.')
      setCurrentStep('preview')
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      ['Date', 'Category', 'Description', 'Amount', 'Currency'],
      ['2024-01-15', 'Food', 'Lunch at restaurant', '25.50', 'USD'],
      ['2024-01-16', 'Transportation', 'Gas for car', '45.00', 'USD'],
      ['2024-01-17', 'Shopping', 'Groceries', '120.75', 'USD'],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
    XLSX.writeFile(workbook, 'expense_template.xlsx')
  }

  const resetImport = () => {
    setImportedData([])
    setCurrentStep('upload')
    setImportProgress(0)
  }

  const validCount = importedData.filter(expense => expense.isValid).length
  const errorCount = importedData.length - validCount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import Expenses from Excel</span>
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) or CSV file to import your expense data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 'upload' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the Excel file here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop an Excel file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports .xlsx, .xls, and .csv files
                    </p>
                  </div>
                )}
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Need a template?</h4>
                    <p className="text-sm text-blue-700">
                      Download our Excel template with the correct format
                    </p>
                  </div>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>

              {/* Format Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Expected Format</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm space-y-1">
                    <p><strong>Column A:</strong> Date (MM/DD/YYYY or YYYY-MM-DD)</p>
                    <p><strong>Column B:</strong> Category (Food, Transportation, Shopping, etc.)</p>
                    <p><strong>Column C:</strong> Description</p>
                    <p><strong>Column D:</strong> Amount (numbers only)</p>
                    <p><strong>Column E:</strong> Currency (USD, EUR, CAD, PKR) - Optional</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{importedData.length}</p>
                      <p className="text-sm text-muted-foreground">Total Rows</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{validCount}</p>
                      <p className="text-sm text-muted-foreground">Valid</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.slice(0, 10).map((expense, index) => (
                      <tr key={index} className={expense.isValid ? '' : 'bg-red-50'}>
                        <td className="px-3 py-2">
                          {expense.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </td>
                        <td className="px-3 py-2">{expense.date || '-'}</td>
                        <td className="px-3 py-2">{expense.category || '-'}</td>
                        <td className="px-3 py-2 truncate max-w-[150px]">{expense.description || '-'}</td>
                        <td className="px-3 py-2">
                          {expense.amount > 0 ? formatCurrency(expense.amount, expense.currency) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedData.length > 10 && (
                  <div className="p-3 text-center text-sm text-gray-500 border-t">
                    ... and {importedData.length - 10} more rows
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button onClick={resetImport} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={validCount === 0 || isDemo}
                  className="min-w-[120px]"
                >
                  Import {validCount} Expenses
                </Button>
              </div>

              {isDemo && (
                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                  Import functionality is disabled in demo mode
                </div>
              )}
            </div>
          )}

          {currentStep === 'importing' && (
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h3 className="text-lg font-medium">Importing Expenses...</h3>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {importProgress}% complete
              </p>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-medium">Import Successful!</h3>
              <p className="text-muted-foreground">
                {validCount} expenses have been imported successfully
              </p>
              <Button onClick={onClose} className="min-w-[120px]">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

