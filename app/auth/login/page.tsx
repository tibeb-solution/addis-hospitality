'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { findUserByEmail, setCurrentUser } from '@/lib/local-storage'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError(t('validation.required'))
      setLoading(false)
      return
    }

    try {
      const user = findUserByEmail(email)

      if (!user) {
        setError(t('auth.invalidCredentials'))
        setLoading(false)
        return
      }

      if (user.password !== password) {
        setError(t('auth.invalidCredentials'))
        setLoading(false)
        return
      }

      // Set current user and route based on role
      setCurrentUser(user)

      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'company') {
        router.push('/company')
      } else {
        router.push('/employee')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← {t('common.back')} {t('common.logo')}
        </Link>

        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">{t('auth.login')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.email')}</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.password')}</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link href="/auth/sign-up" className="text-primary font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </div>
      </div>
    </div>
  )
}
