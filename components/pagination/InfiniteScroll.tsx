'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsIntersecting(true)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [])

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore()
      setIsIntersecting(false)
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

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
