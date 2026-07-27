import { createClient as createLocalClient } from './local-client'

export async function createClient() {
  return createLocalClient()
}
