'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { login, user } = useAuth()

  if (user) {
    router.push('/app')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      login(email.trim())
      router.push('/app')
    }
  }

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <h1 className="text-4xl font-serif text-[var(--fg)] mb-8 text-center">
          Log in
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm text-[var(--muted)] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-transparent border border-[var(--divider)] text-[var(--fg)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            Log in
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--muted)] text-center">
          This is a mock login. Enter any email to continue.
        </p>
      </div>
    </div>
  )
}
