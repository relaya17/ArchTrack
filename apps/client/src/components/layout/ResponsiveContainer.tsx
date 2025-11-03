'use client'

import React from 'react'
import { useResponsive } from './ResponsiveProvider'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  mobileClassName?: string
  tabletClassName?: string
  desktopClassName?: string
}

/**
 * Responsive Container Component
 * Construction Master App - Responsive Layout
 * 
 * Automatically adjusts layout based on screen size
 */
export default function ResponsiveContainer({ 
  children, 
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  const getResponsiveClassName = () => {
    let responsiveClass = className

    if (isMobile && mobileClassName) {
      responsiveClass += ` ${mobileClassName}`
    } else if (isTablet && tabletClassName) {
      responsiveClass += ` ${tabletClassName}`
    } else if (isDesktop && desktopClassName) {
      responsiveClass += ` ${desktopClassName}`
    }

    return responsiveClass
  }

  return (
    <div className={getResponsiveClassName()}>
      {children}
    </div>
  )
}
