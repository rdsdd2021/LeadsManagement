'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as authSignOut, hasPermission } from '@/lib/auth'
import type { AuthUser, UserRole } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isCheckingRef = useRef(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Check active session with timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth check timeout, setting loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    checkUser().finally(() => {
      clearTimeout(timeoutId)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, 'Session:', !!session)
        
        if (event === 'SIGNED_IN' && session) {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 SIGNED_OUT event - clearing user and redirecting')
          setUser(null)
          setLoading(false)
          // Use window.location for immediate redirect
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed - updating user silently')
          // Don't call checkUser on token refresh, just update the session
          // The user data hasn't changed, only the token
        } else if (event === 'USER_UPDATED') {
          console.log('👤 User updated')
          await checkUser()
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) {
      console.log('⏭️ Skipping duplicate auth check')
      return
    }

    try {
      isCheckingRef.current = true
      console.log('🔍 Checking user...')
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        console.log('✅ User check complete:', currentUser.email)
        setUser(currentUser)
        setLoading(false)
      } else {
        console.log('⚠️ No user found')
        setUser(null)
        setLoading(false)
        // Only redirect if we're not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('❌ Error checking user:', error)
      setUser(null)
      setLoading(false)
    } finally {
      isCheckingRef.current = false
    }
  }

  async function signOut() {
    try {
      console.log('🚪 Signing out...')
      
      // Clear React Query cache
      console.log('🧹 Clearing React Query cache...')
      queryClient.clear()
      
      // Clear all localStorage to remove persisted state
      if (typeof window !== 'undefined') {
        console.log('🧹 Clearing localStorage...')
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Sign out from Supabase
      await authSignOut()
      
      // Clear local state
      setUser(null)
      
      // Force immediate redirect with cache busting
      if (typeof window !== 'undefined') {
        window.location.href = '/login?t=' + Date.now()
      }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Even if there's an error, clear everything and redirect
      queryClient.clear()
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setUser(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/login?t=' + Date.now()
      }
    }
  }

  function checkPermission(permission: string): boolean {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  async function refreshUser() {
    await checkUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        hasPermission: checkPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
