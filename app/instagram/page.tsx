import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export default function InstagramPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>
          <Link href="/contact">
            <Button variant="outline">Contact us</Button>
          </Link>
        </header>

        <section className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm shadow-slate-950/10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Instagram
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Page coming soon
          </h1>
          <p className="mt-4 text-muted-foreground leading-7">
            We are preparing our Instagram page with updates, photos, and
            stories from Addis Hospitality. Check back soon for the full
            experience.
          </p>
        </section>
      </div>
    </main>
  );
}
