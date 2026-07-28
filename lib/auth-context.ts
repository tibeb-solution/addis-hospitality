'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, LocalUser } from './local-storage'

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  return { user, loading }
}

export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, will be redirected by middleware
        setIsAuthorized(false)
      } else if (requiredRole && user.role !== requiredRole) {
        // Logged in but wrong role
        setIsAuthorized(false)
      } else {
        // Logged in and authorized
        setIsAuthorized(true)
      }
    }
  }, [user, loading, requiredRole])

  return { user, loading, isAuthorized }
}
