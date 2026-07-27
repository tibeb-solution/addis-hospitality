'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EmployeeSignUpPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="text-xl font-semibold">👤</span>
            </div>
            <h1 className="text-3xl font-bold text-primary">{t('auth.signUpAsEmployee')}</h1>
            <p className="text-sm text-muted-foreground">
              This employee registration form is a placeholder. The full form will be added here soon.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-border/70 bg-background/70 p-6 text-sm text-muted-foreground">
            <p>Use this route as the dedicated employee sign-up page for future profile fields, onboarding steps, and account creation logic.</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/sign-up" className="sm:flex-1">
              <Button variant="outline" className="w-full">
                {t('common.back')}
              </Button>
            </Link>
            <Link href="/auth/login" className="sm:flex-1">
              <Button className="w-full">{t('auth.login')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
