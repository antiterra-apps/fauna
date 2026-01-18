'use client'

import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { getStoredUser, setStoredUser, mockLogin, mockUpgradeToPro } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredUser()
    setUser(stored)
    setLoading(false)
  }, [])

  const login = (email: string) => {
    const newUser = mockLogin(email)
    setStoredUser(newUser)
    setUser(newUser)
  }

  const logout = () => {
    setStoredUser(null)
    setUser(null)
  }

  const upgradeToPro = () => {
    if (!user) return
    const upgraded = mockUpgradeToPro(user)
    setStoredUser(upgraded)
    setUser(upgraded)
  }

  return {
    user,
    isPro: user?.isPro ?? false,
    loading,
    login,
    logout,
    upgradeToPro,
  }
}
