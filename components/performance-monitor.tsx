'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return

    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      function sendToAnalytics(metric: any) {
        // Send to your analytics service
        console.log('Web Vital:', metric)
        
        // Example: Send to Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
          })
        }
      }

      getCLS(sendToAnalytics)
      getFID(sendToAnalytics)
      getFCP(sendToAnalytics)
      getLCP(sendToAnalytics)
      getTTFB(sendToAnalytics)
    })

    // Performance observer for custom metrics
    if ('PerformanceObserver' in window) {
      // Monitor navigation timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming
                         console.log('Navigation Performance:', {
               domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
               loadComplete: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
               ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
             })
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['navigation'] })
      } catch {
        // Some browsers don't support navigation timing
        console.warn('Navigation timing not supported')
      }

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Flag slow resources (over 1s)
          if (resourceEntry.duration > 1000) {
            console.warn('Slow resource detected:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize,
            })
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch {
        console.warn('Resource timing not supported')
      }

      // Cleanup observers
      return () => {
        observer.disconnect()
        resourceObserver.disconnect()
      }
    }
  }, [])

  return null // This component doesn't render anything
}