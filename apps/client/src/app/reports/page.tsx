import React from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const AdvancedReports = dynamic(() => import('../../components/reports/AdvancedReports'), { ssr: false })

export const metadata: Metadata = {
  title: 'דוחות מתקדמים | ProBuilder',
  description: 'מערכת דוחות מתקדמת עם תבניות מותאמות אישית לניתוח פרויקטי בנייה',
}

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <AdvancedReports projectId="current-project" />
    </div>
  )
}
