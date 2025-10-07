'use client'

import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Download, 
  FileText, 
  Save, 
  Undo, 
  Redo,
  Copy,
  Paste,
  Trash2,
  Plus,
  Filter,
  Search
} from 'lucide-react'

interface ToolbarProps {
  onImport: () => void
  onExport: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onAddRow: () => void
  onDeleteRow: () => void
  canUndo: boolean
  canRedo: boolean
}

export default function Toolbar({
  onImport,
  onExport,
  onSave,
  onUndo,
  onRedo,
  onAddRow,
  onDeleteRow,
  canUndo,
  canRedo
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
      {/* Left side - File operations */}
      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline" onClick={onImport}>
          <Upload className="ml-2 h-4 w-4" />
          ייבוא XLSX
        </Button>
        
        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="ml-2 h-4 w-4" />
          ייצוא PDF
        </Button>
        
        <Button size="sm" variant="outline" onClick={onSave}>
          <Save className="ml-2 h-4 w-4" />
          שמירה
        </Button>
      </div>

      {/* Center - Edit operations */}
      <div className="flex items-center space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <Button size="sm" variant="outline">
          <Copy className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="outline">
          <Paste className="h-4 w-4" />
        </Button>
      </div>

      {/* Right side - Row operations */}
      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline" onClick={onAddRow}>
          <Plus className="ml-2 h-4 w-4" />
          הוסף שורה
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDeleteRow}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          מחק שורה
        </Button>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <Button size="sm" variant="outline">
          <Filter className="h-4 w-4" />
        </Button>
        
        <Button size="sm" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
