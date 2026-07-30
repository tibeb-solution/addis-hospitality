import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: July 31, 2026</p>

          <div className="mt-8 space-y-7 leading-7 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
              <p className="mt-2">We collect information you provide when creating and maintaining an account, such as your name, email address, phone number, professional profile, company details, and documents you choose to upload.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">How we use information</h2>
              <p className="mt-2">We use this information to operate the platform, match hospitality professionals with opportunities, manage accounts, verify submitted information, and improve our services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">Sharing and security</h2>
              <p className="mt-2">Profile information may be shared with relevant verified users of the platform. We take reasonable steps to protect your information, but no online service can guarantee absolute security.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground">Your choices</h2>
              <p className="mt-2">You may update your profile information through your account. For privacy questions or requests, please use the Contact page.</p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
