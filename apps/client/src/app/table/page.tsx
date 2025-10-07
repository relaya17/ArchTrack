'use client'

import React, { useState, useRef, useEffect } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Clipboard, 
  Undo, 
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calculator,
  Filter,
  ArrowUpDown
} from 'lucide-react'

interface CellData {
  value: string | number
  formula?: string
  type: 'text' | 'number' | 'formula' | 'date'
  style?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    align?: 'left' | 'center' | 'right'
    backgroundColor?: string
    textColor?: string
  }
}

interface TableData {
  [key: string]: CellData
}

export default function TablePage() {
  const [tableData, setTableData] = useState<TableData>({})
  const [selectedCell, setSelectedCell] = useState<string>('A1')
  const [selectedRange, setSelectedRange] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [history, setHistory] = useState<TableData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [copiedData, setCopiedData] = useState<CellData | null>(null)
  const [showFormulaBar, setShowFormulaBar] = useState(true)
  const [formulaBarValue, setFormulaBarValue] = useState('')
  
  const tableRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate column headers (A, B, C, ...)
  const columns = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  const rows = Array.from({ length: 100 }, (_, i) => i + 1)

  // Initialize table data
  useEffect(() => {
    const initialData: TableData = {}
    rows.forEach(row => {
      columns.forEach(col => {
        const cellId = `${col}${row}`
        initialData[cellId] = {
          value: '',
          type: 'text',
          style: {}
        }
      })
    })
    setTableData(initialData)
    setHistory([initialData])
    setHistoryIndex(0)
  }, [])

  // Save state to history
  const saveToHistory = (newData: TableData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Get cell value for display
  const getCellDisplayValue = (cellId: string): string => {
    const cell = tableData[cellId]
    if (!cell) return ''
    
    if (cell.formula && cell.formula.startsWith('=')) {
      return cell.formula
    }
    
    return String(cell.value)
  }

  // Handle cell click
  const handleCellClick = (cellId: string, event: React.MouseEvent) => {
    event.preventDefault()
    setSelectedCell(cellId)
    setIsEditing(false)
    
    const cell = tableData[cellId]
    if (cell) {
      setEditValue(String(cell.value))
      setFormulaBarValue(cell.formula || String(cell.value))
    }
  }

  // Handle cell double click to edit
  const handleCellDoubleClick = (cellId: string) => {
    setSelectedCell(cellId)
    setIsEditing(true)
    const cell = tableData[cellId]
    if (cell) {
      setEditValue(String(cell.value))
    }
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Handle input change
  const handleInputChange = (value: string) => {
    setEditValue(value)
    setFormulaBarValue(value)
  }

  // Handle input blur (save changes)
  const handleInputBlur = () => {
    if (isEditing) {
      const newData = { ...tableData }
      const cell = newData[selectedCell]
      
      if (cell) {
        if (editValue.startsWith('=')) {
          cell.formula = editValue
          cell.value = calculateFormula(editValue)
          cell.type = 'formula'
        } else {
          cell.value = editValue
          cell.formula = undefined
          cell.type = isNaN(Number(editValue)) ? 'text' : 'number'
        }
      }
      
      setTableData(newData)
      saveToHistory(newData)
      setIsEditing(false)
    }
  }

  // Simple formula calculation
  const calculateFormula = (formula: string): string => {
    try {
      // Remove = and basic math operations
      const expression = formula.slice(1).replace(/[A-Z]+\d+/g, (match) => {
        const cell = tableData[match]
        return cell ? String(cell.value || 0) : '0'
      })
      
      // Basic evaluation (in real app, use a proper formula parser)
      if (expression.includes('+')) {
        const parts = expression.split('+')
        return String(parts.reduce((sum, part) => sum + Number(part.trim() || 0), 0))
      } else if (expression.includes('-')) {
        const parts = expression.split('-')
        return String(Number(parts[0] || 0) - Number(parts[1] || 0))
      } else if (expression.includes('*')) {
        const parts = expression.split('*')
        return String(parts.reduce((product, part) => product * Number(part.trim() || 1), 1))
      } else if (expression.includes('/')) {
        const parts = expression.split('/')
        return String(Number(parts[0] || 0) / Number(parts[1] || 1))
      }
      
      return String(eval(expression) || 0)
    } catch {
      return '#ERROR'
    }
  }

  // Apply formatting
  const applyFormatting = (property: string, value: boolean | string) => {
    const newData = { ...tableData }
    const cell = newData[selectedCell]
    
    if (cell) {
      if (!cell.style) cell.style = {}
      ;(cell.style as Record<string, unknown>)[property] = value
    }
    
    setTableData(newData)
    saveToHistory(newData)
  }

  // Copy cell
  const copyCell = () => {
    const cell = tableData[selectedCell]
    if (cell) {
      setCopiedData(cell)
    }
  }

  // Paste cell
  const pasteCell = () => {
    if (copiedData) {
      const newData = { ...tableData }
      newData[selectedCell] = { ...copiedData }
      setTableData(newData)
      saveToHistory(newData)
    }
  }

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTableData(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTableData(history[historyIndex + 1])
    }
  }

  // Clear cell
  const clearCell = () => {
    const newData = { ...tableData }
    delete newData[selectedCell]
    setTableData(newData)
    saveToHistory(newData)
  }

  // Add new row
  const addRow = () => {
    // Implementation for adding new row
    console.log('Add new row')
  }

  // Add new column
  const addColumn = () => {
    // Implementation for adding new column
    console.log('Add new column')
  }

  // Export to Excel
  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Export to Excel')
  }

  // Import from Excel
  const importFromExcel = () => {
    // Implementation for Excel import
    console.log('Import from Excel')
  }

  return (
    <LayoutWithSidebar>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex flex-wrap items-center gap-2">
          {/* File Operations */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Button variant="outline" size="sm" onClick={importFromExcel}>
              <Upload className="w-4 h-4 mr-2" />
              ייבוא
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              ייצוא
            </Button>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              שמור
            </Button>
          </div>

          {/* Edit Operations */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={copyCell}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={pasteCell} disabled={!copiedData}>
              <Clipboard className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCell}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Formatting */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('bold', !tableData[selectedCell]?.style?.bold)}
              className={tableData[selectedCell]?.style?.bold ? 'bg-gray-200' : ''}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('italic', !tableData[selectedCell]?.style?.italic)}
              className={tableData[selectedCell]?.style?.italic ? 'bg-gray-200' : ''}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('underline', !tableData[selectedCell]?.style?.underline)}
              className={tableData[selectedCell]?.style?.underline ? 'bg-gray-200' : ''}
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('align', 'left')}
              className={tableData[selectedCell]?.style?.align === 'left' ? 'bg-gray-200' : ''}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('align', 'center')}
              className={tableData[selectedCell]?.style?.align === 'center' ? 'bg-gray-200' : ''}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => applyFormatting('align', 'right')}
              className={tableData[selectedCell]?.style?.align === 'right' ? 'bg-gray-200' : ''}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Table Operations */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4 mr-2" />
              שורה
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <Plus className="w-4 h-4 mr-2" />
              עמודה
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              סינון
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              מיון
            </Button>
          </div>
        </div>

        {/* Formula Bar */}
        {showFormulaBar && (
          <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-[60px]">{selectedCell}:</span>
            <input
              ref={inputRef}
              type="text"
              value={formulaBarValue}
              onChange={(e) => setFormulaBarValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputBlur()
                }
              }}
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="הזן נוסחה או ערך..."
            />
            <Button variant="outline" size="sm" onClick={() => setShowFormulaBar(!showFormulaBar)}>
              <Calculator className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto" ref={tableRef}>
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              {/* Column Headers */}
              <thead>
                <tr>
                  <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600"></th>
                  {columns.map(col => (
                    <th 
                      key={col} 
                      className="w-20 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row}>
                    {/* Row Header */}
                    <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center">
                      {row}
                    </td>
                    {/* Data Cells */}
                    {columns.map(col => {
                      const cellId = `${col}${row}`
                      const cell = tableData[cellId]
                      const isSelected = selectedCell === cellId
                      const isEditingThisCell = isSelected && isEditing
                      
                      return (
                        <td
                          key={cellId}
                          className={`
                            w-20 h-8 border border-gray-300 text-xs relative
                            ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}
                            ${cell?.style?.align === 'center' ? 'text-center' : 
                              cell?.style?.align === 'right' ? 'text-right' : 'text-left'}
                          `}
                          onClick={(e) => handleCellClick(cellId, e)}
                          onDoubleClick={() => handleCellDoubleClick(cellId)}
                          style={{
                            fontWeight: cell?.style?.bold ? 'bold' : 'normal',
                            fontStyle: cell?.style?.italic ? 'italic' : 'normal',
                            textDecoration: cell?.style?.underline ? 'underline' : 'none',
                            backgroundColor: cell?.style?.backgroundColor,
                            color: cell?.style?.textColor
                          }}
                        >
                          {isEditingThisCell ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => handleInputChange(e.target.value)}
                              onBlur={handleInputBlur}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInputBlur()
                                } else if (e.key === 'Escape') {
                                  setIsEditing(false)
                                }
                              }}
                              className="w-full h-full border-none outline-none bg-transparent text-xs"
                              title="ערוך תא"
                              placeholder="הזן ערך..."
                              autoFocus
                            />
                          ) : (
                            <span className="block w-full h-full px-1 py-1">
                              {getCellDisplayValue(cellId)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white border-t border-gray-200 p-2 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>תא נבחר: {selectedCell}</span>
            <span>ערך: {tableData[selectedCell]?.value || ''}</span>
            <span>נוסחה: {tableData[selectedCell]?.formula || ''}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>שורות: {rows.length}</span>
            <span>עמודות: {columns.length}</span>
            <span>תאים: {rows.length * columns.length}</span>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
