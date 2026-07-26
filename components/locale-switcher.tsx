'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function LocaleSwitcher() {
  const t = useTranslations('nav')
  const router = useRouter()

  const handleLocaleChange = useCallback(
    (locale: 'en' | 'am') => {
      const setCookieAction = async () => {
        try {
          const response = await fetch('/api/locale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale }),
          })

          if (response.ok) {
            // Refresh the layout with new locale cookie
            setTimeout(() => {
              router.refresh()
            }, 100)
          }
        } catch (error) {
          console.error('Failed to change locale:', error)
        }
      }

      setCookieAction()
    },
    [router],
  )

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleLocaleChange('en')}
        className="px-3 py-1 rounded text-sm font-medium transition-colors hover:bg-accent"
      >
        EN
      </button>
      <button
        onClick={() => handleLocaleChange('am')}
        className="px-3 py-1 rounded text-sm font-medium transition-colors hover:bg-accent font-ethiopic"
      >
        አማርኛ
      </button>
    </div>
  )
}
