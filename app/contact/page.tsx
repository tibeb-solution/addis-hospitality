import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
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

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Get in touch</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Our contact details will be added soon. Please check back later for the official email address and phone number.</p>

          <div className="mt-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
            <p className="font-medium text-foreground">Contact information coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">No placeholder email address or phone number has been published.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
