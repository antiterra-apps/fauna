import type { Metadata } from 'next'
import { Fraunces, Cabin, Libre_Baskerville, Alegreya } from 'next/font/google'
import './globals.css'
import { PaletteProvider } from '@/components/PaletteProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { ConditionalTopNav } from '@/components/ConditionalTopNav'
import { ColorSelectorProvider } from '@/contexts/ColorSelectorContext'

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

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-alegreya',
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
    <html lang="en" className={`${fraunces.variable} ${cabin.variable} ${libreBaskerville.variable} ${alegreya.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <PaletteProvider>
            <ColorSelectorProvider>
              <ConditionalTopNav />
              <main>{children}</main>
            </ColorSelectorProvider>
          </PaletteProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
