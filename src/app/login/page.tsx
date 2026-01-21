'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
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

          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/60 text-xs font-light">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/app' })}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            style={{ borderRadius: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </HeroLayout>
  )
}
