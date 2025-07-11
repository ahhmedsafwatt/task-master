'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import QueryProvider from './react-query-provider'
import { usePathname } from 'next/navigation'
import { LandingDarkWrapper } from '@/components/landing/landing-dark-wrapper'

export default function Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isLandingPage =
    pathname === '/' ||
    (!pathname.startsWith('/dashboard') && !pathname.startsWith('/auth'))

  if (isLandingPage) {
    return <LandingDarkWrapper>{children}</LandingDarkWrapper>
  }

  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster position="bottom-right" richColors />
        {children}
      </ThemeProvider>
    </QueryProvider>
  )
}
