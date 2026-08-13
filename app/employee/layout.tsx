'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import SideNav from '@/components/side-nav'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { getCurrentUser, clearCurrentUser } from '@/lib/local-storage'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser()

      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      if (currentUser.role !== 'employee' && currentUser.role !== 'admin') {
        router.push('/auth/error')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    clearCurrentUser()
    router.push('/auth/login')
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => setSidebarOpen(false), [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="inline-flex items-center justify-center rounded-md p-2 border border-border bg-card">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ThemeSwitcher />
            <LocaleSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <SideNav role="employee" />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {sidebarOpen && <SideNav role="employee" mobile onClose={() => setSidebarOpen(false)} />}
    </div>
  )
}
