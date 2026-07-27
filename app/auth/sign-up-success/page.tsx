'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/auth/login'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {t('auth.signupSuccess')}
            </h1>
            <p className="text-muted-foreground">{t('auth.emailVerificationSent')}</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-600">
            {t('auth.verifyEmail')}
          </div>
        </div>

        <div className="space-y-4">
          <Link href={nextPath} className="block">
            <Button variant="outline" className="w-full">
              {t('auth.login')}
            </Button>
          </Link>

          <div className="text-sm text-muted-foreground">
            {t('auth.resendEmail')}? {''}
            <Link href="/auth/sign-up" className="text-primary font-medium hover:underline">
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
