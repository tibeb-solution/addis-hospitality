import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  let locale = cookieStore.get('locale')?.value || 'en'

  // Validate locale
  if (!['en', 'am'].includes(locale)) {
    locale = 'en'
  }

  const messages = await import(`../messages/${locale}.json`).then(
    (module) => module.default,
  )

  return {
    locale,
    messages,
  }
})
