'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import {
  findUserByEmail,
  generateEmailVerificationCode,
  setCurrentUser,
  setUserEmailVerified,
  verifyEmailVerificationCode,
} from '@/lib/local-storage'

export default function SignUpSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedEmail = localStorage.getItem('ah_pending_verification_email')
    const email = storedEmail || searchParams.get('email') || ''

    if (!email) {
      setError('No pending email verification was found. Please sign up again.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setPendingEmail(normalizedEmail)

    const codeFromUrl = searchParams.get('code')
    const localCode = localStorage.getItem('ah_pending_verification_code')
    setDemoCode(codeFromUrl || localCode || null)
  }, [searchParams])

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!pendingEmail) {
      setError('Session expired. Please sign up again.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const code = String(formData.get('code') || '').trim()

    if (!code) {
      setError('Verification code is required.')
      return
    }

    setLoading(true)

    if (!verifyEmailVerificationCode(pendingEmail, code)) {
      setLoading(false)
      setError('Invalid or expired code. Please request a new one.')
      return
    }

    const user = findUserByEmail(pendingEmail)

    if (!user) {
      setLoading(false)
      setError('User not found. Please sign up again.')
      return
    }

    setUserEmailVerified(pendingEmail, true)
    const verifiedUser = { ...user, email: user.email.trim(), email_verified: true }
    setCurrentUser(verifiedUser)
    localStorage.removeItem('ah_pending_verification_email')
    localStorage.removeItem('ah_pending_verification_code')

    if (user.role === 'admin') {
      router.push('/admin')
    } else if (user.role === 'company') {
      router.push('/company')
    } else {
      router.push('/employee')
    }
  }

  const handleResendCode = () => {
    if (!pendingEmail) return

    const code = generateEmailVerificationCode(pendingEmail)
    setDemoCode(code)
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">Verify your email</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-4 text-center">
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
              <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
              <p className="text-muted-foreground">
                We sent a 6-digit verification code to <span className="font-medium text-foreground">{pendingEmail || 'your email'}</span>.
              </p>
            </div>
          </div>

          {demoCode && (
            <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-700">
              Demo local code: <span className="font-mono font-bold">{demoCode}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification code</label>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify email'}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-primary hover:underline"
            >
              Resend code
            </button>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
