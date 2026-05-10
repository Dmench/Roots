import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms' }

const LAST_UPDATED = '10 May 2026'
const CONTACT_EMAIL = 'dmench9@gmail.com'

export default function TermsPage() {
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
          Terms of Service
        </p>

        <h1 className="font-display font-black text-4xl md:text-5xl leading-tight mb-6"
          style={{ color: '#0A0A0A' }}>
          The deal,<br />in plain English.
        </h1>

        <p className="text-sm leading-relaxed mb-12" style={{ color: 'rgba(10,10,10,0.55)' }}>
          By using Roots, you agree to these terms. We&apos;re a small product in early beta —
          things change. We&apos;ll tell you when they materially do.
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'rgba(10,10,10,0.7)' }}>

          {[
            {
              title: 'Who you\'re dealing with',
              body: `Roots is operated by Daniel Mencher (sole proprietor), reachable at ${CONTACT_EMAIL}. "We", "us" and "Roots" refer to the same.`,
            },
            {
              title: 'What Roots is',
              body: 'Roots is an information and community service for people new to a city. We aggregate public information (events, news, transport disruptions, rental data), curate venue recommendations, generate AI answers to city questions, and host a community feed. Roots is for general guidance only — it is not legal, financial, medical, immigration, tax, or professional advice. Always verify anything important with the relevant authority or a qualified professional.',
            },
            {
              title: 'Your account',
              body: 'You need an email address and password to sign up. You\'re responsible for keeping your account secure. You must be at least 16 years old. One person, one account.',
            },
            {
              title: 'How you may use Roots',
              body: 'You may use Roots for personal, non-commercial purposes. You may not: scrape or bulk-extract data from Roots, build a competing service from its content, attempt to circumvent rate limits or authentication, abuse the Ask feature, post content that is illegal, harassing, threatening, deceptive, or that infringes someone else\'s rights. We may rate-limit, suspend, or remove accounts that abuse the service.',
            },
            {
              title: 'Community content',
              body: 'When you post in the community, you grant Roots a non-exclusive licence to display your post on the platform. You retain ownership of what you write. You\'re responsible for what you post — we may remove content that violates these terms or applicable law without notice. If you spot something that shouldn\'t be there, email us.',
            },
            {
              title: 'AI answers (Ask)',
              body: 'Ask uses an AI model (Anthropic\'s Claude) to generate responses based on the question you submit and limited context about your stage and city. AI output can be wrong, outdated, or incomplete. Treat it as a starting point, not a final answer. There is a daily limit on Ask requests per user.',
            },
            {
              title: 'Third-party links and content',
              body: 'Roots links to third-party websites (event venues, news outlets, Reddit, etc.) and embeds third-party data (maps, photos, transport feeds). We don\'t control those sites and aren\'t responsible for their content, accuracy, or availability.',
            },
            {
              title: 'Service availability',
              body: 'Roots is provided "as is" while in beta. We don\'t guarantee uptime, accuracy, or that any feature will keep working. We may change, suspend, or discontinue features at any time. We\'ll give reasonable notice for material changes when we can.',
            },
            {
              title: 'Liability',
              body: 'To the fullest extent permitted by law, Roots is not liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability for any direct claim is capped at €100. Nothing in these terms excludes liability that cannot lawfully be excluded (e.g. for fraud or wilful misconduct, or your statutory consumer rights under EU law).',
            },
            {
              title: 'Termination',
              body: `You can stop using Roots and delete your account at any time by emailing ${CONTACT_EMAIL}. We can suspend or close your account if you breach these terms or if continued operation would be illegal.`,
            },
            {
              title: 'Changes',
              body: 'We may update these terms. Material changes will be announced by email and the "last updated" date below. Continuing to use Roots after a change means you accept the updated terms.',
            },
            {
              title: 'Governing law',
              body: 'These terms are governed by Belgian law. Disputes go to the competent courts of Brussels, except where mandatory consumer-protection law gives you the right to bring a claim in your country of residence.',
            },
            {
              title: 'Contact',
              body: `Email ${CONTACT_EMAIL} for anything — questions, complaints, deletion requests.`,
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
          See also: <Link href="/privacy" className="underline hover:opacity-70">Privacy Policy</Link>.
        </p>

      </main>

      <Footer />
    </div>
  )
}
