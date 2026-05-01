import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* Minimal nav */}
      <header style={{ borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-lg hover:opacity-50 transition-opacity"
            style={{ color: '#0A0A0A' }}>
            Roots
          </Link>
          <Link href="/brussels"
            className="text-xs font-semibold hover:opacity-60 transition-opacity"
            style={{ color: '#4744C8' }}>
            Open Brussels →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto px-6 md:px-12 py-16 md:py-24">

        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-6"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          Privacy
        </p>

        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-10"
          style={{ color: '#0A0A0A' }}>
          Your data,<br />simply.
        </h1>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.65)' }}>

          {[
            {
              title: 'What we collect',
              body: 'Your email address (for sign-in), your profile information (name, city, neighborhood, arrival date, stage, situations, spots), and any posts you write in the community. Nothing is collected silently — you enter everything yourself.',
            },
            {
              title: 'What we don\'t do',
              body: 'We don\'t sell your data. We don\'t run ads. We don\'t track you across other sites. We don\'t share your information with third parties except to operate the service (Supabase for the database, Resend for email, Vercel for hosting).',
            },
            {
              title: 'The settler directory',
              body: 'Your profile is visible to other logged-in settlers by default. You can turn this off anytime in your profile settings. Your email address is never shown to other users.',
            },
            {
              title: 'Weekly digest',
              body: 'If you subscribe, we send a weekly email with city events, news, and community highlights. You can unsubscribe with one click from any email or in your profile settings.',
            },
            {
              title: 'Deleting your account',
              body: 'Email hello@roots.so and we\'ll delete your account and all associated data within 48 hours. We keep no backups of personal data beyond 30 days.',
            },
            {
              title: 'Questions',
              body: 'Email hello@roots.so. We\'re a small team and we reply.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-sm font-black mb-2" style={{ color: '#0A0A0A' }}>{title}</h2>
              <p>{body}</p>
            </div>
          ))}

        </div>

        <p className="mt-12 text-[10px]" style={{ color: 'rgba(10,10,10,0.25)' }}>
          Last updated May 2026.
        </p>

      </main>

      <Footer />
    </div>
  )
}
