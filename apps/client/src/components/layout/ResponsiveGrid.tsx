'use client'

import React from 'react'
import { useResponsive } from './ResponsiveProvider'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  mobileCols?: number
  tabletCols?: number
  desktopCols?: number
  gap?: string
}

/**
 * Responsive Grid Component
 * Construction Master App - Responsive Grid Layout
 * 
 * Automatically adjusts grid columns based on screen size
 */
export default function ResponsiveGrid({ 
  children, 
  className = '',
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3,
  gap = 'gap-4'
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${mobileCols}`
    if (isTablet) return `grid-cols-${tabletCols}`
    if (isDesktop) return `grid-cols-${desktopCols}`
    return `grid-cols-${desktopCols}`
  }

  const gridClassName = `grid ${getGridCols()} ${gap} ${className}`

  return (
    <div className={gridClassName}>
      {children}
    </div>
  )
}
