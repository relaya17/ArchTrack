'use client'

import React from 'react'
import { Button } from '../ui/button'

/**
 * Skip Links Component
 * Construction Master App - Accessibility Enhancement
 * 
 * Provides keyboard navigation shortcuts for screen readers and keyboard users
 */
export default function SkipLinks() {
  const handleSkipToMain = () => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSkipToNavigation = () => {
    const navigation = document.getElementById('main-navigation')
    if (navigation) {
      navigation.focus()
      navigation.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSkipToSearch = () => {
    const search = document.getElementById('search-input')
    if (search) {
      search.focus()
      search.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-[9999] bg-blue-600 text-white p-2 space-x-2">
        <Button
          onClick={handleSkipToMain}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-700"
        >
          דלג לתוכן הראשי
        </Button>
        <Button
          onClick={handleSkipToNavigation}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-700"
        >
          דלג לתפריט ניווט
        </Button>
        <Button
          onClick={handleSkipToSearch}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-700"
        >
          דלג לחיפוש
        </Button>
      </div>
    </div>
  )
}
