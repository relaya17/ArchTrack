/**
 * Performance Monitoring
 * Construction Master App - Web Vitals & Performance Tracking
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Performance metrics interface
interface PerformanceMetrics {
    name: string
    value: number
    delta: number
    id: string
    navigationType: string
}

// Performance tracking class
class PerformanceTracker {
    private metrics: PerformanceMetrics[] = []
    private isEnabled: boolean = true

    constructor() {
        this.initializeTracking()
    }

    private initializeTracking() {
        if (typeof window === 'undefined' || !this.isEnabled) return

        // Track Core Web Vitals
        getCLS(this.handleMetric.bind(this))
        getFID(this.handleMetric.bind(this))
        getFCP(this.handleMetric.bind(this))
        getLCP(this.handleMetric.bind(this))
        getTTFB(this.handleMetric.bind(this))

        // Track custom metrics
        this.trackCustomMetrics()
    }

    private handleMetric(metric: PerformanceMetrics) {
        this.metrics.push(metric)

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 ${metric.name}:`, metric.value)
        }

        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToAnalytics(metric)
        }
    }

    private trackCustomMetrics() {
        // Track page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now()
            this.handleMetric({
                name: 'Page Load Time',
                value: loadTime,
                delta: loadTime,
                id: 'page-load',
                navigationType: 'navigate'
            })
        })

        // Track first paint
        if ('performance' in window) {
            const paintEntries = performance.getEntriesByType('paint')
            paintEntries.forEach((entry) => {
                this.handleMetric({
                    name: entry.name,
                    value: entry.startTime,
                    delta: entry.startTime,
                    id: entry.name,
                    navigationType: 'navigate'
                })
            })
        }
    }

    private sendToAnalytics(metric: PerformanceMetrics) {
        // Send to your analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', metric.name, {
                event_category: 'Performance',
                value: Math.round(metric.value),
                custom_map: {
                    metric_id: metric.id
                }
            })
        }

        // Send to custom analytics endpoint
        fetch('/api/analytics/performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                metric: metric.name,
                value: metric.value,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(error => {
            console.warn('Failed to send performance metrics:', error)
        })
    }

    // Get all metrics
    getMetrics(): PerformanceMetrics[] {
        return [...this.metrics]
    }

    // Get specific metric
    getMetric(name: string): PerformanceMetrics | undefined {
        return this.metrics.find(metric => metric.name === name)
    }

    // Clear metrics
    clearMetrics() {
        this.metrics = []
    }

    // Enable/disable tracking
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled
    }
}

// Create singleton instance
export const performanceTracker = new PerformanceTracker()

// Export for use in components
export default performanceTracker

