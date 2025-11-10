'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, FolderKanban, TestTube, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {visibleItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
