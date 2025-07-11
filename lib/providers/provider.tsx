'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import DashboardProvider from './dashboard-provider'
import LandingProvider from './landing-provider'

export default function Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we're on landing page (root path or paths that don't start with /dashboard or /auth)
  const isLandingPage = pathname === '/' || 
    (!pathname.startsWith('/dashboard') && !pathname.startsWith('/auth'))
  
  if (isLandingPage) {
    return <LandingProvider>{children}</LandingProvider>
  }
  
  return <DashboardProvider>{children}</DashboardProvider>
}
