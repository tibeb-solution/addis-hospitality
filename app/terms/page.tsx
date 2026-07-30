import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </header>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-muted-foreground">Last updated: July 31, 2026</p>

          <div className="mt-8 space-y-7 leading-7 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground">Using the platform</h2>
              <p className="mt-2">Use Addis Hospitality Service only for lawful professional and hospitality-related purposes. Keep your account details accurate and protect your login credentials.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">Profiles and content</h2>
              <p className="mt-2">You are responsible for the information and documents you submit. Do not upload misleading, unlawful, or infringing content. Companies must provide truthful job and business information.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">Platform availability</h2>
              <p className="mt-2">We may update, improve, suspend, or discontinue parts of the service when necessary. We do not guarantee employment, interviews, hiring outcomes, or uninterrupted availability.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">Changes to these terms</h2>
              <p className="mt-2">We may revise these terms as the service evolves. Continued use after an update means you accept the revised terms.</p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
