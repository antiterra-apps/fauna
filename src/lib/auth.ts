import { User } from './types'

const STORAGE_KEY = 'fauna_user'

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

export const setStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const mockLogin = (email: string): User => {
  return {
    id: '1',
    email,
    isPro: false,
  }
}

export const mockUpgradeToPro = (user: User): User => {
  return {
    ...user,
    isPro: true,
  }
}
