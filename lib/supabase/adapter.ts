import { createClient as createLocalClient } from './client'

/**
 * Adapter to obtain a Supabase-like client.
 *
 * Current behavior: returns the existing local-storage mock client so the app
 * continues to work in development without a Supabase project.
 *
 * To switch to a real Supabase client later:
 * - Install `@supabase/supabase-js`
 * - Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * - Replace the implementation below to return a real client.
 */
export function getClient() {
  // Default: local-storage mock
  return createLocalClient()
}

// Example (commented) dynamic approach to create a real supabase client:
// export async function getClient() {
//   if (typeof window === 'undefined') return createLocalClient()
//   const url = process.env.NEXT_PUBLIC_SUPABASE_URL
//   const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
//   if (url && key) {
//     const supabaseJs = await import('@supabase/supabase-js')
//     const supabase = supabaseJs.createClient(url, key)
//     return supabase
//   }
//   return createLocalClient()
// }

export default getClient
