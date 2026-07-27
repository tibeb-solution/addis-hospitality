'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Role = 'employee' | 'company'

export default function SignUpPage() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as Role | null) ?? 'employee'
  const [role, setRole] = useState<Role>(initialRole)
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

    try {
      const supabase = createClient()

      // Build metadata based on role
      const metadata: Record<string, any> = {
        role,
        full_name: formData.get('fullName') || '',
        phone: formData.get('phone') || '',
      }

      if (role === 'employee') {
        metadata.first_name = formData.get('firstName') || ''
        metadata.last_name = formData.get('lastName') || ''
        metadata.city = formData.get('city') || ''
      } else {
        metadata.company_name = formData.get('companyName') || ''
        metadata.business_type = formData.get('businessType') || ''
        metadata.city = formData.get('city') || ''
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: metadata,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const destination = role === 'company' ? '/company' : '/employee'
      router.push(`/auth/sign-up-success?next=${encodeURIComponent(destination)}`)
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

  const inputClassName =
    'w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl font-semibold">✦</span>
            </div>
            <h1 className="text-3xl font-bold text-primary">{t('common.logo')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.signUp')}</p>
          </div>

          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Selected role</p>
              <p className="mt-1">
                {role === 'employee' ? t('auth.signUpAsEmployee') : t('auth.signUpAsCompany')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
                className={inputClassName}
              />
            </div>

            {role === 'employee' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('auth.firstName')}</label>
                    <input
                      name="firstName"
                      placeholder={t('auth.firstName')}
                      disabled={loading}
                      className={inputClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('auth.lastName')}</label>
                    <input
                      name="lastName"
                      placeholder={t('auth.lastName')}
                      disabled={loading}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('auth.city')}</label>
                  <input name="city" placeholder={t('auth.city')} disabled={loading} className={inputClassName} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('auth.companyName')}</label>
                  <input
                    name="companyName"
                    placeholder={t('auth.companyName')}
                    disabled={loading}
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('auth.businessType')}</label>
                  <select
                    name="businessType"
                    disabled={loading}
                    className={inputClassName}
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
                  <label className="text-sm font-medium text-foreground">{t('auth.city')}</label>
                  <input name="city" placeholder={t('auth.city')} disabled={loading} className={inputClassName} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.phone')}</label>
              <input
                name="phone"
                type="tel"
                placeholder="+251..."
                disabled={loading}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                required
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.passwordConfirm')}</label>
              <input
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                required
                className={inputClassName}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? t('common.loading') : t('auth.signUp')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
