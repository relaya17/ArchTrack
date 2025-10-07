'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calculator, 
  FileText, 
  MessageSquare, 
  Users,
  LogOut,
  Settings,
  Table,
  Calendar,
  Pencil
} from 'lucide-react'
import { Button } from '../ui/button'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
  { id: 'table', label: 'טבלה', icon: Table },
  { id: 'self-management', label: 'ניהול עצמי', icon: Calendar },
  { id: 'boq', label: 'BOQ', icon: Calculator },
  { id: 'drawings', label: 'Drawings', icon: FileText },
  { id: 'drawing', label: 'כלי ציור', icon: Pencil },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        ProBuilder
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-right transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="ml-3 h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
      
      {/* User Actions */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={() => window.location.href = '/settings'}
        >
          <Settings className="ml-3 h-4 w-4" />
          הגדרות
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full"
        >
          <LogOut className="ml-3 h-4 w-4" />
          התנתק
        </Button>
      </div>
    </div>
  )
}
