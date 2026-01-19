'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import HeroLayout from '@/app/home/layout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) router.push('/app')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const trimmedEmail = email.trim()
    let hasError = false

    if (!trimmedEmail) {
      setEmailError('Enter your email.')
      hasError = true
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email.')
      hasError = true
    } else {
      setEmailError(null)
    }

    if (!password) {
      setPasswordError('Enter your password.')
      hasError = true
    } else {
      setPasswordError(null)
    }

    if (hasError) return

    setSubmitting(true)
    setPasswordError(null)
    try {
      const res = await login(trimmedEmail, password)
      if (!res || res.ok !== true) {
        setPasswordError('Invalid email or password.')
        return
      }
      router.push('/app')
    } finally {
      setSubmitting(false)
    }
  }

  if (user) return null

  return (
    <HeroLayout>
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        <div className="w-96 flex flex-col items-center text-center gap-5">
          <div
            className="w-full text-white text-xl font-light"
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            A generative illustration library
          </div>

          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 text-sm font-light"
              style={{ borderRadius: 0 }}
            />
            {emailError && (
              <div
                id="email-error"
                className="text-xs font-light text-white/80 text-left"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                {emailError}
              </div>
            )}
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(null)
              }}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 text-sm font-light"
              style={{ borderRadius: 0 }}
            />
            {passwordError && (
              <div
                id="password-error"
                className="text-xs font-light text-white/80 text-left"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                {passwordError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
              style={{ borderRadius: 0 }}
            >
              {submitting ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </HeroLayout>
  )
}
