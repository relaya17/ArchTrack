import React from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const DocumentManager = dynamic(() => import('../../components/documents/DocumentManager'), { ssr: false })

export const metadata: Metadata = {
  title: 'ניהול מסמכים | ProBuilder',
  description: 'מערכת ניהול מסמכים מתקדמת לפרויקטי בנייה עם גרסאות ושליטה בגישה',
}

export default function DocumentsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <DocumentManager projectId="current-project" />
    </div>
  )
}
