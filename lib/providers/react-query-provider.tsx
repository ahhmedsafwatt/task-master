'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { useState } from 'react'
import { ErrorHandler } from '@/lib/utils/error-handler'

// Enhanced error handler for React Query
const queryErrorHandler = (error: unknown) => {
  const appError = ErrorHandler.handleUnknownError(error, 'reactQuery')
  ErrorHandler.logError(appError)
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time - how long data is considered fresh
            staleTime: 1000 * 60 * 5, // 5 minutes
            
            // Cache time - how long data stays in cache when component unmounts
            gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
            
            // Retry configuration
            retry: (failureCount: number, error: any) => {
              // Don't retry on authentication errors
              if (error?.code === 'AUTH_ERROR' || error?.status === 401) {
                return false
              }
              // Don't retry on validation errors
              if (error?.code === 'VALIDATION_ERROR' || error?.status === 400) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Refetch on window focus (useful for real-time updates)
            refetchOnWindowFocus: true,
            
            // Refetch on network reconnect
            refetchOnReconnect: true,
            
            // Error handling
            onError: queryErrorHandler,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
            
            // Retry delay for mutations
            retryDelay: 2000,
            
            // Error handling for mutations
            onError: queryErrorHandler,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
