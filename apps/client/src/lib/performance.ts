// Performance optimization utilities

// Image optimization
export const optimizeImage = (src: string, width?: number, height?: number, quality = 75) => {
  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  
  return `${src}?${params.toString()}`
}

// Lazy loading for components
export const lazyLoadComponent = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc)
}

// Debounce utility for search and filters
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Memoization for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map()
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Virtual scrolling for large lists
export const getVisibleItems = (
  items: any[],
  containerHeight: number,
  itemHeight: number,
  scrollTop: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  return {
    items: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight
  }
}

// Bundle size optimization
export const loadChunk = async (chunkName: string) => {
  try {
    const module = await import(`../components/${chunkName}`)
    return module.default
  } catch (error) {
    console.error(`Failed to load chunk: ${chunkName}`, error)
    return null
  }
}

// Memory management
export const cleanupResources = () => {
  // Clear unused data from memory
  if (typeof window !== 'undefined') {
    // Clear unused images from cache
    const images = document.querySelectorAll('img[data-lazy]')
    images.forEach(img => {
      if (!img.getBoundingClientRect().intersects) {
        img.removeAttribute('src')
      }
    })
  }
}

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/fonts/inter.woff2',
    '/icons/sprite.svg',
    '/images/logo.png'
  ]
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    link.as = resource.endsWith('.woff2') ? 'font' : 'image'
    document.head.appendChild(link)
  })
}

// Service Worker for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

// Web Vitals monitoring
export const reportWebVitals = (metric: any) => {
  console.log('Web Vital:', metric)
  
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true
    })
  }
}

// Bundle analyzer
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      console.log('Bundle analysis available')
    })
  }
}

// Code splitting utilities
export const createAsyncComponent = (importFunc: () => Promise<any>) => {
  return React.lazy(() => importFunc().catch(() => ({
    default: () => <div>Error loading component</div>
  })))
}

// Resource hints
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'preload', href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
  ]
  
  hints.forEach(hint => {
    const link = document.createElement('link')
    Object.assign(link, hint)
    document.head.appendChild(link)
  })
}

// Critical CSS extraction
export const extractCriticalCSS = () => {
  // This would be handled by build tools like Next.js
  // But we can ensure critical styles are inlined
  const criticalSelectors = [
    '.container',
    '.btn',
    '.card',
    '.sidebar',
    '.header'
  ]
  
  return criticalSelectors.join(', ')
}

// Image lazy loading
export const setupLazyLoading = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

// Performance budget monitoring
export const checkPerformanceBudget = () => {
  const budget = {
    js: 250000, // 250KB
    css: 50000,  // 50KB
    images: 1000000, // 1MB
    fonts: 100000 // 100KB
  }
  
  // This would be implemented with webpack-bundle-analyzer
  // or similar tools in the build process
  return budget
}

export default {
  optimizeImage,
  lazyLoadComponent,
  debounce,
  memoize,
  getVisibleItems,
  loadChunk,
  cleanupResources,
  measurePerformance,
  preloadCriticalResources,
  registerServiceWorker,
  reportWebVitals,
  analyzeBundle,
  createAsyncComponent,
  addResourceHints,
  extractCriticalCSS,
  setupLazyLoading,
  checkPerformanceBudget
}