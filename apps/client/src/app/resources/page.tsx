import React from 'react'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const ResourceManager = dynamic(() => import('../../components/resources/ResourceManager'), { ssr: false })

export const metadata: Metadata = {
  title: 'ניהול משאבים | ProBuilder',
  description: 'ניהול מתקדם של משאבי פרויקט - אנשים, ציוד, חומרים ורכבים',
}

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <ResourceManager projectId="current-project" />
    </div>
  )
}
