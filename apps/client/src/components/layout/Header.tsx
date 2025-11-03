'use client'

import { Button } from '../ui/button'
import { Bell, Settings, User } from 'lucide-react'

interface HeaderProps {
  projectName: string
  userName: string
}

export default function Header({ projectName, userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between bg-white shadow-sm px-6 py-4 border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {projectName}
        </h1>
        <div className="text-sm text-gray-500">
          פרויקט בנייה פעיל
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button variant="outline" size="sm">
          <Settings className="ml-2 h-4 w-4" />
          הגדרות
        </Button>
        
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
          <User className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            שלום, {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
