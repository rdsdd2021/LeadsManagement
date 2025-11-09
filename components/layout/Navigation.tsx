'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, FolderKanban, TestTube, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      roles: ['admin', 'manager', 'sales_rep']
    },
    {
      name: 'Import Leads',
      href: '/import-leads',
      icon: Upload,
      roles: ['admin', 'manager']
    },
    {
      name: 'Manage Buckets',
      href: '/manage-buckets',
      icon: FolderKanban,
      roles: ['admin']
    },
    {
      name: 'Manage Users',
      href: '/manage-users',
      icon: Shield,
      roles: ['admin']
    },
    {
      name: 'Performance Tests',
      href: '/test-performance',
      icon: TestTube,
      roles: ['admin']
    },
    {
      name: 'Auth Tests',
      href: '/test-auth',
      icon: Shield,
      roles: ['admin']
    }
  ]

  // Filter nav items based on user role
  const visibleItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  return (
    <nav className="border-b bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
