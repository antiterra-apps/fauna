import type { Metadata } from 'next'
import { Fraunces, Cabin, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import { PaletteProvider } from '@/components/PaletteProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { ConditionalTopNav } from '@/components/ConditionalTopNav'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const cabin = Cabin({
  subsets: ['latin'],
  variable: '--font-cabin',
  display: 'swap',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fauna',
  description: 'Premium fauna assets and illustrations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${cabin.variable} ${libreBaskerville.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <PaletteProvider>
            <ConditionalTopNav />
            <main>{children}</main>
          </PaletteProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
