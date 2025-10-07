// Accessibility utilities and helpers

// Focus management
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)
  
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// ARIA helpers
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Keyboard navigation
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      onEnter?.()
      break
    case 'Escape':
      onEscape?.()
      break
    case 'ArrowUp':
      onArrowUp?.()
      break
    case 'ArrowDown':
      onArrowDown?.()
      break
  }
}

// Color contrast checker
export const checkColorContrast = (foreground: string, background: string) => {
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const fgLuminance = getLuminance(foreground)
  const bgLuminance = getLuminance(background)
  
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                   (Math.min(fgLuminance, bgLuminance) + 0.05)
  
  return {
    ratio: contrast,
    passes: contrast >= 4.5, // WCAG AA standard
    passesLarge: contrast >= 3 // WCAG AA for large text
  }
}

// Screen reader only text
export const srOnly = 'sr-only'

// Skip links
export const createSkipLink = (targetId: string, text: string) => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
  
  return skipLink
}

// High contrast mode detection
export const isHighContrastMode = () => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Reduced motion detection
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Focus visible polyfill
export const setupFocusVisible = () => {
  if (typeof window !== 'undefined') {
    // Add focus-visible class for better focus indicators
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('focus-visible')
      }
    })
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('focus-visible')
    })
  }
}

// ARIA live regions
export const createLiveRegion = (politeness: 'polite' | 'assertive' = 'polite') => {
  const region = document.createElement('div')
  region.setAttribute('aria-live', politeness)
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  document.body.appendChild(region)
  
  return {
    announce: (message: string) => {
      region.textContent = message
    },
    remove: () => {
      document.body.removeChild(region)
    }
  }
}

// Form validation helpers
export const getFieldError = (fieldName: string, errors: Record<string, string>) => {
  return errors[fieldName] || ''
}

export const hasFieldError = (fieldName: string, errors: Record<string, string>) => {
  return !!errors[fieldName]
}

// Accessibility testing helpers
export const runA11yTests = () => {
  const issues: string[] = []
  
  // Check for missing alt text
  const images = document.querySelectorAll('img:not([alt])')
  images.forEach(img => {
    issues.push(`Image missing alt text: ${img.src}`)
  })
  
  // Check for missing labels
  const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
  inputs.forEach(input => {
    if (!input.closest('label')) {
      issues.push(`Input missing label: ${input.name || input.id}`)
    }
  })
  
  // Check for missing headings
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    issues.push('Page missing heading structure')
  }
  
  return issues
}

// Keyboard shortcuts
export const createKeyboardShortcut = (
  key: string,
  callback: () => void,
  modifiers: string[] = []
) => {
  const handleKeydown = (e: KeyboardEvent) => {
    const hasModifiers = modifiers.every(mod => {
      switch (mod) {
        case 'ctrl': return e.ctrlKey
        case 'alt': return e.altKey
        case 'shift': return e.shiftKey
        case 'meta': return e.metaKey
        default: return false
      }
    })
    
    if (e.key === key && hasModifiers) {
      e.preventDefault()
      callback()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
}

export default {
  trapFocus,
  announceToScreenReader,
  handleKeyboardNavigation,
  checkColorContrast,
  srOnly,
  createSkipLink,
  isHighContrastMode,
  prefersReducedMotion,
  setupFocusVisible,
  createLiveRegion,
  getFieldError,
  hasFieldError,
  runA11yTests,
  createKeyboardShortcut
}
