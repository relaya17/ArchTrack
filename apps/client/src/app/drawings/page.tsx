'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  FileText, 
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter
} from 'lucide-react'

export default function DrawingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const drawings = [
    { 
      id: 1, 
      name: 'תכנית קומה 1', 
      category: 'ארכיטקטורה',
      version: 'v2.1',
      lastModified: '2024-01-15',
      size: '3.2 MB',
      status: 'אושר'
    },
    { 
      id: 2, 
      name: 'תכנית חשמל', 
      category: 'חשמל',
      version: 'v1.3',
      lastModified: '2024-01-14',
      size: '2.1 MB',
      status: 'בבדיקה'
    },
    { 
      id: 3, 
      name: 'תכנית אינסטלציה', 
      category: 'אינסטלציה',
      version: 'v1.0',
      lastModified: '2024-01-13',
      size: '1.8 MB',
      status: 'טיוטה'
    },
    { 
      id: 4, 
      name: 'תכנית מבנה', 
      category: 'מבנה',
      version: 'v3.0',
      lastModified: '2024-01-12',
      size: '4.5 MB',
      status: 'אושר'
    },
  ]

  const categories = ['all', 'ארכיטקטורה', 'חשמל', 'אינסטלציה', 'מבנה']

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = drawing.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || drawing.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'אושר': return 'bg-green-100 text-green-800'
      case 'בבדיקה': return 'bg-yellow-100 text-yellow-800'
      case 'טיוטה': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <LayoutWithSidebar>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">תכניות ושרטוטים</h1>
          <p className="text-gray-600">ניהול תכניות ארכיטקטורה, מבנה וטכניות</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="חיפוש תכניות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  title="בחר קטגוריה"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'כל הקטגוריות' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                העלה תכנית
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                תכנית חדשה
              </Button>
            </div>
          </div>
        </div>

        {/* Drawings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrawings.map((drawing) => (
            <div key={drawing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{drawing.name}</h3>
              <p className="text-sm text-gray-600 mb-1">קטגוריה: {drawing.category}</p>
              <p className="text-sm text-gray-600 mb-1">גרסה: {drawing.version}</p>
              <p className="text-sm text-gray-600 mb-1">עודכן: {drawing.lastModified}</p>
              <p className="text-sm text-gray-500 mb-4">גודל: {drawing.size}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(drawing.status)}`}>
                  {drawing.status}
                </span>
              </div>
              
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

        {filteredDrawings.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו תכניות</h3>
            <p className="text-gray-600 mb-6">התחל ביצירת תכנית חדשה או העלאת קובץ קיים</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              צור תכנית חדשה
            </Button>
          </div>
        )}
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
