'use client'

import React from 'react'
import { useResponsive } from './ResponsiveProvider'

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  mobileSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  tabletSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  desktopSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}

/**
 * Responsive Text Component
 * Construction Master App - Responsive Typography
 * 
 * Automatically adjusts text size based on screen size
 */
export default function ResponsiveText({ 
  children, 
  className = '',
  mobileSize = 'base',
  tabletSize = 'lg',
  desktopSize = 'xl',
  as: Component = 'p'
}: ResponsiveTextProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  const getTextSize = () => {
    if (isMobile) return `text-${mobileSize}`
    if (isTablet) return `text-${tabletSize}`
    if (isDesktop) return `text-${desktopSize}`
    return `text-${desktopSize}`
  }

  const textClassName = `${getTextSize()} ${className}`

  return (
    <Component className={textClassName}>
      {children}
    </Component>
  )
}
