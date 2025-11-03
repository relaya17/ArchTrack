'use client'

import { useState } from 'react'
import { cn } from '../../lib/utils'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-300 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-6 py-3 -mb-px border-b-2 font-medium text-sm transition-colors",
            activeTab === tab.id
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300"
          )}
        >
          {tab.label}
          {tab.count && (
            <span className="mr-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
