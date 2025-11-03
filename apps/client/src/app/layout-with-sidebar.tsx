'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '../components/layout/Sidebar'

interface LayoutWithSidebarProps {
  children: React.ReactNode
}

export default function LayoutWithSidebar({ children }: LayoutWithSidebarProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const pathname = usePathname()

  // Map pathname to tab
  React.useEffect(() => {
    const pathToTab = {
      '/dashboard': 'dashboard',
      '/sheets': 'sheets',
      '/table': 'table',
      '/self-management': 'self-management',
      '/boq': 'boq',
      '/drawings': 'drawings',
      '/drawing': 'drawing',
      '/gantt': 'gantt',
      '/resources': 'resources',
      '/documents': 'documents',
      '/reports': 'reports',
      '/chat': 'chat',
      '/users': 'users',
      '/settings': 'settings',
    }
    
    const currentTab = pathToTab[pathname as keyof typeof pathToTab] || 'dashboard'
    setActiveTab(currentTab)
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigate to the corresponding page
    const tabToPath = {
      'dashboard': '/dashboard',
      'sheets': '/sheets',
      'table': '/table',
      'self-management': '/self-management',
      'boq': '/boq',
      'drawings': '/drawings',
      'drawing': '/drawing',
      'gantt': '/gantt',
      'resources': '/resources',
      'documents': '/documents',
      'reports': '/reports',
      'chat': '/chat',
      'users': '/users',
      'settings': '/settings',
    }
    
    const path = tabToPath[tab as keyof typeof tabToPath]
    if (path) {
      window.location.href = path
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
