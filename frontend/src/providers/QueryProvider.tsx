import React, { Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../services/queryClient'

interface QueryProviderProps {
  children: React.ReactNode
}

// Lazy load DevTools only in development
const ReactQueryDevtools = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((module: any) => ({
    default: module.ReactQueryDevtools
  }))
)

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools 
            initialIsOpen={false}
            buttonPosition={"bottom-right" as any}
          />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}