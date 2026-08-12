import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Camera, Mail, MapPin, Phone, Video } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </header>

        <section className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-2xl shadow-slate-950/10">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-slate-950/95 px-6 py-7 text-white sm:px-8 sm:py-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Get in touch
              </p>
              <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Reach out to Addis Hospitality Solutions using the details
                below. We are ready to answer your questions and support your
                hospitality journey.
              </p>

              <div className="mt-8 space-y-3">
                <a
                  href="mailto:addis.hospitalitysolutions@gmail.com"
                  className="group flex items-center gap-3 rounded-3xl border border-slate-800 bg-white/5 px-4 py-3 transition hover:border-primary/70 hover:bg-white/10"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-primary text-white shadow-sm shadow-primary/20">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                      Email
                    </p>
                    <p className="text-base font-semibold">
                      addis.hospitalitysolutions@gmail.com
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+251941248888"
                  className="group flex items-center gap-3 rounded-3xl border border-slate-800 bg-white/5 px-4 py-3 transition hover:border-primary/70 hover:bg-white/10"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-primary text-white shadow-sm shadow-primary/20">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                      Phone
                    </p>
                    <p className="text-base font-semibold">+251 94 124 8888</p>
                  </div>
                </a>

                <div className="group flex items-center gap-3 rounded-3xl border border-slate-800 bg-white/5 px-4 py-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-primary text-white shadow-sm shadow-primary/20">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                      Location
                    </p>
                    <p className="text-base font-semibold">
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background/95 px-6 py-8 sm:px-10 sm:py-12">
              <div className="rounded-3xl border border-border bg-white/90 p-6 shadow-sm shadow-slate-950/5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Social pages
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                  Instagram · TikTok · YouTube
                </h2>
                <p className="mt-4 text-muted-foreground leading-7">
                  Our social pages are coming soon. Check back later for the
                  full pages with links and updates.
                </p>

                <div className="mt-8 grid gap-3">
                  <Link
                    href="/instagram"
                    className="group flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-primary/70 hover:bg-primary/5"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      <Camera className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">Instagram</p>
                      <p className="text-sm text-muted-foreground">
                        Page coming soon
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/tiktok"
                    className="group flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-primary/70 hover:bg-primary/5"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      <Video className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">TikTok</p>
                      <p className="text-sm text-muted-foreground">
                        Page coming soon
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/youtube"
                    className="group flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-primary/70 hover:bg-primary/5"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      <Video className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">YouTube</p>
                      <p className="text-sm text-muted-foreground">
                        Page coming soon
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
