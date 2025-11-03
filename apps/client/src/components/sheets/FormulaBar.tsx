'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Calculator, Check, X } from 'lucide-react'

interface FormulaBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  isEditing: boolean
}

export default function FormulaBar({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  isEditing 
}: FormulaBarProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleSubmit = () => {
    onChange(localValue)
    onSubmit()
  }

  const handleCancel = () => {
    setLocalValue(value)
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <Calculator className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">נוסחה:</span>
      </div>
      
      <div className="flex-1">
        <input
          type="text"
          value={isEditing ? localValue : value}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="הזן נוסחה: =SUM(B2:B10)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ direction: 'ltr' }}
        />
      </div>
      
      {isEditing && (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubmit}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  )
}
