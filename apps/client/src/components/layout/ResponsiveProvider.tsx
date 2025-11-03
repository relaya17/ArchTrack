'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ResponsiveContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined)

export const useResponsive = () => {
  const context = useContext(ResponsiveContext)
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider')
  }
  return context
}

interface ResponsiveProviderProps {
  children: React.ReactNode
}

export default function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const [screenWidth, setScreenWidth] = useState(0)
  const [screenHeight, setScreenHeight] = useState(0)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(window.innerWidth)
      setScreenHeight(window.innerHeight)
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }

    // Initial call
    updateDimensions()

    // Add event listener
    window.addEventListener('resize', updateDimensions)

    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const isMobile = screenWidth < 768
  const isTablet = screenWidth >= 768 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  const value: ResponsiveContextType = {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    orientation,
  }

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  )
}
