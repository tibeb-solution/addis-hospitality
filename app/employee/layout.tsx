'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/locale-switcher'

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
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.role !== 'employee' && user?.user_metadata?.role !== 'admin') {
        router.push('/auth/error')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
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
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/employee" className="text-xl font-bold text-primary">
            {t('common.logo')}
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/employee" className="text-foreground hover:text-primary">
              {t('nav.dashboard')}
            </Link>
            <Link href="/employee/profile" className="text-foreground hover:text-primary">
              {t('nav.profile')}
            </Link>
            <Link href="/employee/documents" className="text-foreground hover:text-primary">
              {t('nav.documents')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
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
