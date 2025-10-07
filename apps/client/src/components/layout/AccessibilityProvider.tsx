'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilityContextType {
  isHighContrast: boolean
  isReducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  screenReaderMode: boolean
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  toggleScreenReaderMode: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium')
  const [screenReaderMode, setScreenReaderMode] = useState(false)

  useEffect(() => {
    // Check for user's system preferences
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      setIsReducedMotion(prefersReducedMotion.matches)
      
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
      setIsHighContrast(prefersHighContrast.matches)
    }

    // Load saved preferences
    const savedFontSize = localStorage.getItem('accessibility-font-size') as 'small' | 'medium' | 'large'
    if (savedFontSize) {
      setFontSizeState(savedFontSize)
    }

    const savedHighContrast = localStorage.getItem('accessibility-high-contrast') === 'true'
    setIsHighContrast(savedHighContrast)

    const savedReducedMotion = localStorage.getItem('accessibility-reduced-motion') === 'true'
    setIsReducedMotion(savedReducedMotion)

    const savedScreenReaderMode = localStorage.getItem('accessibility-screen-reader') === 'true'
    setScreenReaderMode(savedScreenReaderMode)
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    document.documentElement.setAttribute('data-high-contrast', isHighContrast.toString())
    document.documentElement.setAttribute('data-reduced-motion', isReducedMotion.toString())
    document.documentElement.setAttribute('data-font-size', fontSize)
    document.documentElement.setAttribute('data-screen-reader', screenReaderMode.toString())

    // Save preferences
    localStorage.setItem('accessibility-font-size', fontSize)
    localStorage.setItem('accessibility-high-contrast', isHighContrast.toString())
    localStorage.setItem('accessibility-reduced-motion', isReducedMotion.toString())
    localStorage.setItem('accessibility-screen-reader', screenReaderMode.toString())
  }, [isHighContrast, isReducedMotion, fontSize, screenReaderMode])

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast)
  }

  const toggleReducedMotion = () => {
    setIsReducedMotion(!isReducedMotion)
  }

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size)
  }

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(!screenReaderMode)
  }

  const value: AccessibilityContextType = {
    isHighContrast,
    isReducedMotion,
    fontSize,
    screenReaderMode,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleScreenReaderMode,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
