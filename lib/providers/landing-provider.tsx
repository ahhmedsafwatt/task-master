'use client'

import React from 'react'
import { Toaster } from 'sonner'

export default function LandingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      {children}
    </>
  )
}