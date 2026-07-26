'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-destructive">{t('errors.notFound')}</h1>
            <p className="text-muted-foreground">{t('auth.invalidCredentials')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full">{t('auth.login')}</Button>
          </Link>
          <Link href="/auth/sign-up" className="block">
            <Button variant="outline" className="w-full">
              {t('auth.signUp')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
