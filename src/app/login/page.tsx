'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import HeroLayout from '@/app/home/layout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) router.push('/app')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() && password) {
      await login(email.trim(), password)
      router.push('/app')
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

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 text-sm font-light"
              style={{ borderRadius: 0 }}
            />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 text-sm font-light"
              style={{ borderRadius: 0 }}
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-light hover:bg-white/20 transition-all"
              style={{ borderRadius: 0 }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </HeroLayout>
  )
}
