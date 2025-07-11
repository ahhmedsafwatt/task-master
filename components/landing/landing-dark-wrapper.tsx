'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function LandingDarkWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  useEffect(() => {
    // Check if we're on landing page
    const isLandingPage = pathname === '/' || 
      (!pathname.startsWith('/dashboard') && !pathname.startsWith('/auth'))
    
    if (isLandingPage) {
      // Force dark mode for landing page
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [pathname])
  
  return <>{children}</>
}