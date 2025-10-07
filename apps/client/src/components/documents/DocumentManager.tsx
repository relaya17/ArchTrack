'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Share, 
  Lock, 
  Unlock,
  Search,
  Filter,
  Grid,
  List,
  Folder,
  File,
  Image,
  Video,
  Archive,
  Plus,
  MoreVertical
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'xls' | 'image' | 'video' | 'archive' | 'other'
  size: number
  uploadDate: Date
  lastModified: Date
  uploadedBy: string
  version: string
  status: 'draft' | 'review' | 'approved' | 'archived'
  category: string
  tags: string[]
  isPublic: boolean
  downloadCount: number
  description?: string
  folder?: string
}

interface DocumentManagerProps {
  projectId: string
  documents?: Document[]
  onDocumentUpload?: (file: File) => void
  onDocumentUpdate?: (document: Document) => void
  onDocumentDelete?: (documentId: string) => void
  onDocumentShare?: (documentId: string, permissions: string[]) => void
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  projectId,
  documents = [],
  onDocumentUpload,
  onDocumentUpdate,
  onDocumentDelete,
  onDocumentShare
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')

  // Mock data for demonstration
  const mockDocuments: Document[] = [
    {
      id: '1',
      name: 'תכנית אדריכלית.pdf',
      type: 'pdf',
      size: 2.5 * 1024 * 1024, // 2.5MB
      uploadDate: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      uploadedBy: 'יוסי כהן',
      version: '1.2',
      status: 'approved',
      category: 'תכניות',
      tags: ['אדריכלות', 'תכנון', 'אישור'],
      isPublic: true,
      downloadCount: 15,
      description: 'תכנית אדריכלית מפורטת של הפרויקט',
      folder: 'תכניות'
    },
    {
      id: '2',
      name: 'חישובי עלויות.xlsx',
      type: 'xls',
      size: 1.2 * 1024 * 1024, // 1.2MB
      uploadDate: new Date('2024-01-10'),
      lastModified: new Date('2024-01-18'),
      uploadedBy: 'שרה לוי',
      version: '2.0',
      status: 'review',
      category: 'תקציב',
      tags: ['עלויות', 'תקציב', 'חישובים'],
      isPublic: false,
      downloadCount: 8,
      description: 'חישובי עלויות מפורטים לפרויקט',
      folder: 'תקציב'
    },
    {
      id: '3',
      name: 'תמונות אתר.jpg',
      type: 'image',
      size: 5.8 * 1024 * 1024, // 5.8MB
      uploadDate: new Date('2024-01-25'),
      lastModified: new Date('2024-01-25'),
      uploadedBy: 'דוד ישראלי',
      version: '1.0',
      status: 'approved',
      category: 'תיעוד',
      tags: ['תמונות', 'אתר', 'תיעוד'],
      isPublic: true,
      downloadCount: 23,
      description: 'תמונות עדכניות של האתר',
      folder: 'תיעוד'
    }
  ]

  const displayDocuments = documents.length > 0 ? documents : mockDocuments

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />
      case 'doc': return <FileText className="h-5 w-5 text-blue-500" />
      case 'xls': return <FileText className="h-5 w-5 text-green-500" />
      case 'image': return <Image className="h-5 w-5 text-purple-500" />
      case 'video': return <Video className="h-5 w-5 text-orange-500" />
      case 'archive': return <Archive className="h-5 w-5 text-gray-500" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'טיוטה'
      case 'review': return 'בבדיקה'
      case 'approved': return 'אושר'
      case 'archived': return 'בארכיון'
      default: return 'לא ידוע'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = displayDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || doc.type === filterType
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder
    return matchesSearch && matchesType && matchesStatus && matchesFolder
  })

  const folders = [...new Set(displayDocuments.map(doc => doc.folder).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              ניהול מסמכים
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                העלה קובץ
              </Button>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                תיקייה חדשה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="חיפוש מסמכים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">כל הסוגים</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word</option>
                <option value="xls">Excel</option>
                <option value="image">תמונות</option>
                <option value="video">וידאו</option>
                <option value="archive">ארכיונים</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="draft">טיוטה</option>
              <option value="review">בבדיקה</option>
              <option value="approved">אושר</option>
              <option value="archived">בארכיון</option>
            </select>

            {folders.length > 0 && (
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">כל התיקיות</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              {filteredDocuments.length} מסמכים
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document) => (
            <Card 
              key={document.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedDocument(document)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {getFileIcon(document.type)}
                  <div className="flex items-center space-x-1">
                    {document.isPublic ? (
                      <Unlock className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                    <MoreVertical className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-sm truncate">{document.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatFileSize(document.size)}</span>
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                      {getStatusText(document.status)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {document.uploadedBy} • {document.uploadDate.toLocaleDateString('he-IL')}
                  </div>

                  {document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {document.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{document.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>הורדות: {document.downloadCount}</span>
                    <span>גרסה: {document.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">שם קובץ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">סוג</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">גודל</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">סטטוס</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">הועלה על ידי</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">תאריך</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <tr 
                      key={document.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedDocument(document)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {getFileIcon(document.type)}
                          <span className="mr-2 text-sm font-medium">{document.name}</span>
                          {document.isPublic ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{document.type.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatFileSize(document.size)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(document.status)}`}>
                          {getStatusText(document.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{document.uploadedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{document.uploadDate.toLocaleDateString('he-IL')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Details Modal */}
      {selectedDocument && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {getFileIcon(selectedDocument.type)}
                <span className="ml-2">{selectedDocument.name}</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocument(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">גודל קובץ</label>
                <p>{formatFileSize(selectedDocument.size)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">גרסה</label>
                <p>{selectedDocument.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium">סטטוס</label>
                <p className="capitalize">{getStatusText(selectedDocument.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">הועלה על ידי</label>
                <p>{selectedDocument.uploadedBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium">תאריך העלאה</label>
                <p>{selectedDocument.uploadDate.toLocaleDateString('he-IL')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">שונה לאחרונה</label>
                <p>{selectedDocument.lastModified.toLocaleDateString('he-IL')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">הורדות</label>
                <p>{selectedDocument.downloadCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium">נגישות</label>
                <p>{selectedDocument.isPublic ? 'ציבורי' : 'פרטי'}</p>
              </div>
            </div>

            {selectedDocument.description && (
              <div className="mt-4">
                <label className="text-sm font-medium">תיאור</label>
                <p className="text-gray-600">{selectedDocument.description}</p>
              </div>
            )}

            {selectedDocument.tags.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">תגיות</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDocument.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                צפה
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                הורד
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                שתף
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                ערוך
              </Button>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                מחק
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentManager
