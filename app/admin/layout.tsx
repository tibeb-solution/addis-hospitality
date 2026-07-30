'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { getCurrentUser, clearCurrentUser } from '@/lib/local-storage'

export default function AdminLayout({
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

      if (currentUser.role !== 'admin') {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <BrandLogo />
            <span className="font-bold text-lg text-primary hidden sm:inline">
              {t('admin.title')}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/admin" className="text-foreground hover:text-primary transition-colors">
              {t('admin.dashboard')}
            </Link>
            <Link href="/admin/employees" className="text-foreground hover:text-primary transition-colors">
              {t('admin.employeeList')}
            </Link>
            <Link href="/admin/companies" className="text-foreground hover:text-primary transition-colors">
              {t('admin.companyList')}
            </Link>
            <Link href="/admin/audit" className="text-foreground hover:text-primary transition-colors">
              {t('admin.auditLog')}
            </Link>
          </nav>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
