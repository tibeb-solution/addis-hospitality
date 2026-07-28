'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createUser, findUserByEmail, setCurrentUser } from '@/lib/local-storage'

type Role = 'employee' | 'company'

export default function SignUpPage() {
  const t = useTranslations()
  const router = useRouter()
  const [role, setRole] = useState<Role>('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const passwordConfirm = formData.get('passwordConfirm') as string

    // Validation
    if (!email || !password || !passwordConfirm) {
      setError(t('validation.required'))
      setLoading(false)
      return
    }

    if (password !== passwordConfirm) {
      setError(t('auth.passwordsMustMatch'))
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      setLoading(false)
      return
    }

    // Check if email already exists
    if (findUserByEmail(email)) {
      setError(t('auth.emailAlreadyExists'))
      setLoading(false)
      return
    }

    try {
      // Build user data based on role
      const userData: Record<string, any> = {
        phone: formData.get('phone') || '',
      }

      if (role === 'employee') {
        userData.full_name = `${formData.get('firstName')} ${formData.get('lastName')}`.trim()
        userData.city = formData.get('city') || ''
      } else {
        userData.company_name = formData.get('companyName') || ''
        userData.business_type = formData.get('businessType') || ''
        userData.city = formData.get('city') || ''
      }

      const user = createUser(email, password, role, userData)
      setCurrentUser(user)

      router.push('/auth/sign-up-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'))
      setLoading(false)
    }
  }

  const businessTypes = [
    'hotel',
    'resort',
    'lodge',
    'restaurant',
    'cafe',
    'bar',
    'catering',
    'event_venue',
    'tour_operator',
    'other',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">{t('common.logo')}</h1>
          <p className="text-muted-foreground">{t('auth.signUp')}</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('auth.selectRole')}</label>
            <div className="flex gap-3">
              {(['employee', 'company'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    role === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {r === 'employee'
                    ? t('auth.signUpAsEmployee')
                    : t('auth.signUpAsCompany')}
                </button>
              ))}
            </div>
          </div>

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

          {/* Role-specific fields */}
          {role === 'employee' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.firstName')}</label>
                  <input
                    name="firstName"
                    placeholder={t('auth.firstName')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.lastName')}</label>
                  <input
                    name="lastName"
                    placeholder={t('auth.lastName')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.city')}</label>
                <input name="city" placeholder={t('auth.city')} disabled={loading} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.companyName')}</label>
                <input
                  name="companyName"
                  placeholder={t('auth.companyName')}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.businessType')}</label>
                <select
                  name="businessType"
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{t('auth.selectBusinessType')}</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`taxonomy.business_${type}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.city')}</label>
                <input name="city" placeholder={t('auth.city')} disabled={loading} className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </>
          )}

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.phone')}</label>
            <input
              name="phone"
              type="tel"
              placeholder="+251..."
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
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.passwordConfirm')}</label>
            <input
              name="passwordConfirm"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? t('common.loading') : t('auth.signUp')}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center text-sm">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
