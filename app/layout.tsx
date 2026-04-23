import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700', '900'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roots-mu.vercel.app'
  ),
  title: {
    default: 'Roots — Put down roots, anywhere',
    template: '%s — Roots',
  },
  description: 'City onboarding and belonging. Settle in, get set up, and find your people — in Brussels, Lisbon, and beyond.',
  openGraph: {
    type: 'website',
    siteName: 'Roots',
    title: 'Roots — Put down roots, anywhere',
    description: 'City onboarding and belonging. Settle in, get set up, and find your people.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roots — Put down roots, anywhere',
    description: 'City onboarding and belonging. Settle in, get set up, and find your people.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-cream text-espresso antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
