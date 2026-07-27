'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/locale-switcher'

export default function LandingPage() {
  const t = useTranslations()
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">{t('common.logo')}</div>

          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
            <Button size="sm" onClick={() => setIsSignupModalOpen(true)}>
              {t('auth.signUp')}
            </Button>
          </div>
        </div>
      </header>

      {isSignupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_80px_rgba(15,23,42,0.24)]">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Choose your path</p>
              <h2 className="text-2xl font-semibold text-foreground">{t('auth.signUp')}</h2>
              <p className="text-sm text-muted-foreground">Pick the account type that fits you best.</p>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/auth/sign-up/employee" onClick={() => setIsSignupModalOpen(false)} className="block">
                <Button className="w-full justify-center" size="lg">
                  {t('auth.signUpAsEmployee')}
                </Button>
              </Link>
              <Link href="/auth/sign-up/company" onClick={() => setIsSignupModalOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-center" size="lg">
                  {t('auth.signUpAsCompany')}
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignupModalOpen(false)}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:py-32">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              {t('landing.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.tagline')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/auth/sign-up/employee">
              <Button size="lg" className="w-full sm:w-auto">
                {t('auth.signUpAsEmployee')}
              </Button>
            </Link>
            <Link href="/auth/sign-up/company">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('auth.signUpAsCompany')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            {t('landing.features')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{t('landing.feature1Title')}</h3>
              <p className="text-muted-foreground">{t('landing.feature1Desc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{t('landing.feature2Title')}</h3>
              <p className="text-muted-foreground">{t('landing.feature2Desc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{t('landing.feature3Title')}</h3>
              <p className="text-muted-foreground">{t('landing.feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            {t('landing.howItWorks')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Employees */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">{t('employee.title')}</h3>
              <ol className="space-y-4">
                {['step1', 'step2', 'step3'].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{t(`landing.employee_${step}_title`)}</p>
                      <p className="text-muted-foreground text-sm">{t(`landing.employee_${step}_desc`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Companies */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">{t('company.title')}</h3>
              <ol className="space-y-4">
                {['step1', 'step2', 'step3'].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-accent/20 text-accent font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{t(`landing.company_${step}_title`)}</p>
                      <p className="text-muted-foreground text-sm">{t(`landing.company_${step}_desc`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto space-y-8 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t('landing.readyToStart')}
          </h2>

          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t('landing.ctaDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up/employee">
              <Button size="lg" variant="secondary">
                {t('auth.signUpAsEmployee')}
              </Button>
            </Link>
            <Link href="/auth/sign-up/company">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                {t('auth.signUpAsCompany')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2024 {t('common.logo')}. {t('landing.allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              {t('landing.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t('landing.terms')}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {t('landing.contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
