'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import ErrorTestButtons from '../../components/debug/ErrorTestButtons'
import AbortDemo from '../../components/debug/AbortDemo'
import { 
  Building2, 
  Calculator, 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react'

export default function DashboardPage() {
  const [lastError, setLastError] = useState<string | null>(null)
  const useErrorAlerts = require('../../hooks/useErrorAlerts').default as (opts?: { notify?: (e: { message: string }) => void }) => void
  useErrorAlerts({ notify: (e) => setLastError(e.message) })

  const widthClassFor = (progress: number) => {
    const p = Math.max(0, Math.min(100, Math.round(progress / 5) * 5))
    const map: Record<number, string> = {
      0: 'w-[0%]', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]',
      25: 'w-[25%]', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]',
      50: 'w-[50%]', 55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]',
      75: 'w-[75%]', 80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]',
      100: 'w-[100%]'
    }
    return map[p]
  }
  const projects = [
    { id: 1, name: 'פרויקט מגדל יוקרה', status: 'פעיל', progress: 75, budget: '₪15M' },
    { id: 2, name: 'בניית בית פרטי', status: 'תכנון', progress: 30, budget: '₪2.5M' },
    { id: 3, name: 'שיפוץ משרדים', status: 'הושלם', progress: 100, budget: '₪800K' },
  ]

  const kpis = [
    { label: 'פרויקטים פעילים', value: '12', icon: Building2, color: 'text-blue-500' },
    { label: 'ערך כולל', value: '₪45M', icon: TrendingUp, color: 'text-green-500' },
    { label: 'צוות פעיל', value: '28', icon: Users, color: 'text-purple-500' },
    { label: 'תקציב נותר', value: '₪12M', icon: Calculator, color: 'text-orange-500' },
  ]

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">סקירה כללית של הפרויקטים והביצועים</p>
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-4">
              <ErrorTestButtons />
              <div className="mt-2">
                <AbortDemo />
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50 ${kpi.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">פרויקטים אחרונים</h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                פרויקט חדש
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600">סטטוס: {project.status}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{project.budget}</p>
                      <p className="text-xs text-gray-600">{project.progress}% הושלם</p>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className={"bg-blue-600 h-2 rounded-full transition-all duration-300 " + widthClassFor(project.progress)} />
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      צפה
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
