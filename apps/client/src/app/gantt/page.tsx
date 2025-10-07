import React from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const GanttChart = dynamic(() => import('../../components/gantt/GanttChart'), { ssr: false })

export const metadata: Metadata = {
  title: 'לוח זמנים - Gantt Chart | ProBuilder',
  description: 'ניהול לוחות זמנים מתקדם עם Gantt Charts לפרויקטי בנייה',
}

export default function GanttPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <GanttChart projectId="current-project" />
    </div>
  )
}
