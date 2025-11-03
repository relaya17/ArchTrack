'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import ErrorTestButtons from '../../components/debug/ErrorTestButtons'
import { 
  FileSpreadsheet, 
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Search
} from 'lucide-react'

export default function SheetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [lastError, setLastError] = useState<string | null>(null)
  const useErrorAlerts = require('../../hooks/useErrorAlerts').default as (opts?: { notify?: (e: { message: string }) => void }) => void
  useErrorAlerts({ notify: (e) => setLastError(e.message) })
  
  const sheets = [
    { id: 1, name: 'גיליון כמויות - קומה 1', lastModified: '2024-01-15', size: '2.3 MB' },
    { id: 2, name: 'תקציב פרויקט - בניין A', lastModified: '2024-01-14', size: '1.8 MB' },
    { id: 3, name: 'חישוב עלויות - חשמל', lastModified: '2024-01-13', size: '945 KB' },
    { id: 4, name: 'רשימת חומרים - פלדה', lastModified: '2024-01-12', size: '1.2 MB' },
  ]

  const filteredSheets = sheets.filter(sheet => 
    sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <LayoutWithSidebar>
      <div className="p-6">
      {lastError && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-red-600/90 text-white rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{lastError}</span>
            <button
              type="button"
              className="text-white/80 hover:text-white text-sm"
              aria-label="סגור הודעת שגיאה"
              onClick={() => setLastError(null)}
            >
              סגור
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">גיליונות</h1>
          <p className="text-gray-600">ניהול ועריכה של גיליונות כמויות ותקציבים</p>
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-4">
              <ErrorTestButtons />
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="חיפוש גיליונות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                ייבוא
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                ייצוא
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                גיליון חדש
              </Button>
            </div>
          </div>
        </div>

        {/* Sheets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSheets.map((sheet) => (
            <div key={sheet.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{sheet.name}</h3>
              <p className="text-sm text-gray-600 mb-1">עודכן: {sheet.lastModified}</p>
              <p className="text-sm text-gray-500 mb-4">גודל: {sheet.size}</p>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  פתח
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredSheets.length === 0 && (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו גיליונות</h3>
            <p className="text-gray-600 mb-6">התחל ביצירת גיליון חדש או ייבוא קובץ קיים</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              צור גיליון חדש
            </Button>
          </div>
        )}
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
