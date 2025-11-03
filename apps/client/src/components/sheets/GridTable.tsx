'use client'

import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { Paperclip, MessageSquare, Eye } from 'lucide-react'

interface GridCell {
  id: string
  value: string | number
  formula?: string
  attachments?: string[]
  comments?: string[]
  type: 'text' | 'number' | 'currency' | 'formula'
  category: 'concrete' | 'steel' | 'gypsum' | 'electrical' | 'plumbing'
}

interface GridTableProps {
  data: GridCell[]
  onCellEdit: (cellId: string, value: string) => void
  onCellSelect: (cellId: string) => void
  selectedCell?: string
}

const categoryColors = {
  concrete: 'text-blue-600',
  steel: 'text-green-600', 
  gypsum: 'text-purple-600',
  electrical: 'text-yellow-600',
  plumbing: 'text-orange-600'
}

const categoryLabels = {
  concrete: 'בטון',
  steel: 'פלדה',
  gypsum: 'גבס',
  electrical: 'חשמל',
  plumbing: 'אינסטלציה'
}

export default function GridTable({ 
  data, 
  onCellEdit, 
  onCellSelect, 
  selectedCell 
}: GridTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleCellClick = (cell: GridCell) => {
    onCellSelect(cell.id)
    setEditingCell(cell.id)
    setEditValue(cell.value.toString())
  }

  const handleCellSubmit = () => {
    if (editingCell) {
      onCellEdit(editingCell, editValue)
      setEditingCell(null)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSubmit()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  return (
    <div className="overflow-auto border border-gray-300 rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              #
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              פריט
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              יחידה
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              כמות
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              מחיר יחידה
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              סה"כ
            </th>
            <th className="border border-gray-300 p-3 text-right font-semibold text-gray-700">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((cell, index) => (
            <tr 
              key={cell.id}
              className={cn(
                "hover:bg-gray-50 cursor-pointer transition-colors",
                selectedCell === cell.id && "bg-blue-50 border-blue-200"
              )}
            >
              <td className="border border-gray-300 p-3 text-center text-gray-600">
                {index + 1}
              </td>
              <td 
                className={cn(
                  "border border-gray-300 p-3 font-semibold",
                  categoryColors[cell.category]
                )}
                onClick={() => handleCellClick(cell)}
              >
                {editingCell === cell.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCellSubmit}
                    className="w-full border-none outline-none bg-transparent"
                    placeholder="הקלד שם פריט"
                    title="עריכת שם הפריט"
                    autoFocus
                  />
                ) : (
                  categoryLabels[cell.category]
                )}
              </td>
              <td className="border border-gray-300 p-3 text-center">
                {cell.type === 'currency' ? '₪' : 'יחידה'}
              </td>
              <td 
                className="border border-gray-300 p-3 text-center"
                onClick={() => handleCellClick(cell)}
              >
                {editingCell === cell.id ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCellSubmit}
                    className="w-full border-none outline-none bg-transparent text-center"
                    placeholder="הקלד כמות"
                    title="עריכת כמות"
                    autoFocus
                  />
                ) : (
                  cell.value
                )}
              </td>
              <td className="border border-gray-300 p-3 text-center">
                ₪{typeof cell.value === 'number' ? cell.value.toLocaleString() : cell.value}
              </td>
              <td className="border border-gray-300 p-3 text-center font-semibold">
                ₪{(typeof cell.value === 'number' ? cell.value * 1.2 : 0).toLocaleString()}
              </td>
              <td className="border border-gray-300 p-3">
                <div className="flex items-center justify-center space-x-2">
                  {cell.attachments && cell.attachments.length > 0 && (
                    <button type="button" title="צפייה בקבצים מצורפים" className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      <Paperclip className="h-4 w-4" />
                    </button>
                  )}
                  {cell.comments && cell.comments.length > 0 && (
                    <button type="button" title="צפייה בהערות" className="p-1 text-green-600 hover:bg-green-100 rounded">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" title="צפייה בפרטים" className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}