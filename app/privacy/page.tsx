import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy' }

const LAST_UPDATED = '10 May 2026'
const CONTACT_EMAIL = 'dmench9@gmail.com'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
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

      <main className="flex-1 max-w-2xl mx-auto px-6 md:px-12 py-16 md:py-24">

        <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-6"
          style={{ color: 'rgba(10,10,10,0.3)' }}>
          Privacy Policy
        </p>

        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-6"
          style={{ color: '#0A0A0A' }}>
          Your data,<br />simply.
        </h1>

        <p className="text-sm leading-relaxed mb-12" style={{ color: 'rgba(10,10,10,0.55)' }}>
          We&apos;re a small product helping people settle into a new city. This page explains
          what we collect, why, where it lives, and the rights you have over it under GDPR.
          Plain language first; the legal specifics are below.
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)' }}>

          {[
            {
              title: 'Who we are (data controller)',
              body: `Roots is operated by Daniel Mencher (sole proprietor), reachable at ${CONTACT_EMAIL}. We are the data controller for personal data you provide while using Roots.`,
            },
            {
              title: 'What we collect',
              body: 'When you create an account: your email address (for sign-in). When you set up your profile: display name, city, neighborhood, arrival date, life stage, situations, languages, and any "spots" you save. When you use the community: posts and comments you write. When you use Ask: the questions you submit are sent to Anthropic for response generation. We store a daily count of Ask requests per user (for rate limiting). We do not collect anything silently — you enter everything yourself.',
            },
            {
              title: 'Why we collect it (legal basis)',
              body: 'Email and profile data: to provide the service you signed up for (GDPR Art. 6(1)(b) — performance of a contract). Community posts: with your consent, posted publicly to other authenticated users (Art. 6(1)(a)). Rate-limit counts and basic logs: legitimate interest in keeping the service safe and preventing abuse (Art. 6(1)(f)).',
            },
            {
              title: 'What we don\'t do',
              body: 'We don\'t sell your data. We don\'t run ads. We don\'t track you across other websites. We don\'t use cookies for advertising. We don\'t share your information with third parties except the processors listed below, who help us operate the service.',
            },
            {
              title: 'Sub-processors we use',
              body: 'Supabase (database and authentication) — data hosted in the EU. Vercel (web hosting and analytics) — US-based, GDPR data processing addendum in place. Resend (transactional and digest email) — US-based. Anthropic (the Ask feature only — your questions are sent for response generation) — US-based. Google Maps Platform (maps and venue photos on Eat) — receives your IP and request information when these features render. Where data is transferred outside the EU/EEA, we rely on the EU Standard Contractual Clauses.',
            },
            {
              title: 'Cookies and similar tech',
              body: 'We use a session cookie for authentication. We use Vercel Web Analytics, which is privacy-friendly and does not set tracking cookies or share data with third parties. We do not use advertising cookies.',
            },
            {
              title: 'The settler directory',
              body: 'Your profile is visible to other logged-in settlers in your city by default. You can turn this off anytime in your profile settings. Your email address is never shown to other users.',
            },
            {
              title: 'Weekly digest',
              body: 'If you opt in, we send a weekly email with city events, news, and community highlights. You can unsubscribe with one click from any email or in your profile settings.',
            },
            {
              title: 'Retention',
              body: 'Account data is kept for as long as your account is active. Posts and comments remain visible to other users until you delete them or your account. Ask rate-limit counts are kept for 90 days. Server logs are kept for up to 30 days. Backups containing personal data are kept for up to 30 days.',
            },
            {
              title: 'Your rights under GDPR',
              body: `You can ask us to access, correct, export, restrict, or delete your personal data. You can object to processing based on legitimate interest. You can withdraw consent at any time. To exercise any of these rights, email ${CONTACT_EMAIL} — we respond within 30 days. If you believe we are mishandling your data, you have the right to lodge a complaint with your local data protection authority. In Belgium that is the Autorité de protection des données / Gegevensbeschermingsautoriteit (autoriteprotectiondonnees.be).`,
            },
            {
              title: 'Deleting your account',
              body: `Email ${CONTACT_EMAIL} and we'll delete your account and all associated personal data within 14 days. Backups containing your data age out within 30 more days.`,
            },
            {
              title: 'Children',
              body: 'Roots is not intended for users under 16. We do not knowingly collect data from children. If you believe a child has signed up, contact us and we will delete the account.',
            },
            {
              title: 'Changes to this policy',
              body: 'If we make material changes, we\'ll notify users by email and update the "last updated" date below. Minor edits are made without notice.',
            },
            {
              title: 'Questions',
              body: `Email ${CONTACT_EMAIL}. We're a small team and we reply.`,
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-sm font-black mb-2" style={{ color: '#0A0A0A' }}>{title}</h2>
              <p>{body}</p>
            </div>
          ))}

        </div>

        <p className="mt-12 text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>
          Last updated {LAST_UPDATED}.
        </p>

        <p className="mt-3 text-[10px]" style={{ color: 'rgba(10,10,10,0.3)' }}>
          See also: <Link href="/terms" className="underline hover:opacity-70">Terms of Service</Link>.
        </p>

      </main>

      <Footer />
    </div>
  )
}
