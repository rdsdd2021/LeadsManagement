import { supabase } from './supabase'

// User roles for RBAC
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES_REP = 'sales_rep',
  VIEWER = 'viewer'
}

// Role permissions
export const rolePermissions = {
  [UserRole.ADMIN]: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
  [UserRole.MANAGER]: ['read', 'write', 'delete', 'assign_leads'],
  [UserRole.SALES_REP]: ['read', 'write', 'update_own_leads'],
  [UserRole.VIEWER]: ['read']
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  metadata?: any
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('❌ Sign in error:', error)
    return { error: error.message, user: null }
  }

  // Get user role from user metadata or database
  const userRole = await getUserRole(data.user.id)
  
  console.log('✅ Signed in as:', data.user.email, 'Role:', userRole)
  
  return { 
    error: null, 
    user: {
      id: data.user.id,
      email: data.user.email!,
      role: userRole,
      metadata: data.user.user_metadata
    } as AuthUser
  }
}

export async function signOut() {
  await supabase.auth.signOut()
  console.log('🚪 Signed out')
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // First check if we have a session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('⚠️ No active session')
      return null
    }

    // Then get the user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ Error getting user:', error.message)
      return null
    }
    
    if (!user) {
      console.log('⚠️ No user found')
      return null
    }

    const role = await getUserRole(user.id)
    
    return {
      id: user.id,
      email: user.email!,
      role,
      metadata: user.user_metadata
    }
  } catch (error) {
    console.error('❌ getCurrentUser failed:', error)
    return null
  }
}

async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('getUserRole timeout')), 3000)
    })

    const queryPromise = supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error || !data) {
      console.error('⚠️ Error fetching user role:', error?.message || 'No data')
      // Default role if not found
      return UserRole.VIEWER
    }

    return data.role as UserRole
  } catch (err) {
    console.error('❌ getUserRole failed:', err)
    return UserRole.VIEWER
  }
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(permission)
}

export function canAccessResource(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.ADMIN]: 4,
    [UserRole.MANAGER]: 3,
    [UserRole.SALES_REP]: 2,
    [UserRole.VIEWER]: 1
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}