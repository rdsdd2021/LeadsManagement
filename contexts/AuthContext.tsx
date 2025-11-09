'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as authSignOut, hasPermission } from '@/lib/auth'
import type { AuthUser, UserRole } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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
        console.log('🔐 Auth state changed:', event)
        if (event === 'SIGNED_IN' && session) {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          router.push('/login')
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      console.log('🔍 Checking user...')
      const currentUser = await getCurrentUser()
      console.log('✅ User check complete:', currentUser?.email || 'No user')
      setUser(currentUser)
    } catch (error) {
      console.error('❌ Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await authSignOut()
    setUser(null)
    router.push('/login')
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
