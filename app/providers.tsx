'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, createContext, useContext } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ImportProvider } from '@/contexts/ImportContext'

// Create a context to expose queryClient
const QueryClientContext = createContext<QueryClient | null>(null)

export function useQueryClientContext() {
  const context = useContext(QueryClientContext)
  if (!context) {
    throw new Error('useQueryClientContext must be used within Providers')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
            onError: (error) => {
              console.error('❌ Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <QueryClientContext.Provider value={queryClient}>
        <AuthProvider>
          <ImportProvider>
            {children}
          </ImportProvider>
        </AuthProvider>
      </QueryClientContext.Provider>
      {/* Dev tools - only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}