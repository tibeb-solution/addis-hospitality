import { createClient as createLocalClient } from './local-client'

export function createClient() {
  return createLocalClient()
}
