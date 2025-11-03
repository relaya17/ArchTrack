'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { 
  Paperclip, 
  MessageSquare, 
  Send, 
  FileText, 
  Download,
  Upload,
  History,
  Users
} from 'lucide-react'

interface Attachment {
  id: string
  name: string
  type: string
  size: string
  uploadedBy: string
  uploadedAt: string
}

interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
}

interface SidePanelProps {
  attachments: Attachment[]
  comments: Comment[]
  onSendMessage: (message: string) => void
  onUploadFile: (file: File) => void
}

export default function SidePanel({ 
  attachments, 
  comments, 
  onSendMessage, 
  onUploadFile 
}: SidePanelProps) {
  const [newMessage, setNewMessage] = useState('')
  const [newComment, setNewComment] = useState('')

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadFile(file)
    }
  }

  return (
    <div className="w-80 flex flex-col space-y-4">
      {/* Attachments Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Paperclip className="ml-2 h-5 w-5" />
            קבצים מצורפים
          </h3>
          <label className="cursor-pointer" title="העלאת קובץ">
            <Upload className="h-5 w-5 text-blue-600 hover:text-blue-700" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.dwg,.xlsx,.docx"
              aria-label="העלאת קובץ"
            />
          </label>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {attachments.map((attachment) => (
            <div 
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attachment.size} • {attachment.uploadedBy}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="ml-2 h-5 w-5" />
            צ'אט צוות
          </h3>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">3 פעילים</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-600">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {comment.timestamp}
                </span>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שלח הודעה..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Version History */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
          <History className="ml-2 h-5 w-5" />
          היסטוריית גרסאות
        </h3>
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium text-gray-900">גרסה 1.2</p>
            <p className="text-gray-500">עדכון מחירי בטון • ארלט • לפני 2 שעות</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">גרסה 1.1</p>
            <p className="text-gray-500">הוספת פריטי פלדה • דני • אתמול</p>
          </div>
        </div>
      </div>
    </div>
  )
}
