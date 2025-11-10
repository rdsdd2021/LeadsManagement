'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollProps {
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  children: React.ReactNode
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  children,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading) {
        console.log('🔄 Infinite scroll triggered - loading more...')
        onLoadMore()
      }
    },
    [hasMore, loading, onLoadMore]
  )

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px', // Trigger 100px before reaching the element
      threshold: 0.1,
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [handleObserver])

  return (
    <>
      {children}
      
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll for more</div>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No more results
        </div>
      )}
    </>
  )
}
