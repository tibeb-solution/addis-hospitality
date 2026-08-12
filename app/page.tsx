"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Camera,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Video,
  X,
  Layers3,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top info bar */}
      <div className="bg-slate-950 text-slate-100 shadow-sm shadow-slate-950/10">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href="mailto:addis.hospitalitysolutions@gmail.com"
              className="group flex min-w-[180px] items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 transition hover:bg-slate-900"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                <Mail className="h-4 w-4" />
              </span>
              <span className="truncate font-medium">
                addis.hospitalitysolutions@gmail.com
              </span>
            </a>
            <a
              href="tel:+251941248888"
              className="group flex min-w-[130px] items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 transition hover:bg-slate-900"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                <Phone className="h-4 w-4" />
              </span>
              <span className="font-medium">+251 94 124 8888</span>
            </a>
            <div className="group flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="font-medium">Addis Ababa</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-end">
            <Link
              href="/instagram"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-medium text-white transition hover:bg-slate-900"
            >
              <Camera className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Instagram</span>
            </Link>
            <Link
              href="/tiktok"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-medium text-white transition hover:bg-slate-900"
            >
              <Video className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">TikTok</span>
            </Link>
            <Link
              href="/youtube"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-[10px] font-medium text-white transition hover:bg-slate-900"
            >
              <Video className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">YouTube</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="absolute left-4 hover:opacity-90 transition-opacity"
            >
              <BrandLogo />
            </Link>

            <nav aria-label="Main navigation" className="hidden md:flex gap-8">
              {[
                ["nav.home", "#home"],
                ["nav.about", "#about"],
                ["nav.news", "#news"],
                ["nav.projects", "#projects"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-base font-semibold text-muted-foreground transition-colors hover:text-primary ${
                    label === "nav.home" ? "text-foreground" : ""
                  }`}
                >
                  {t(label)}
                </Link>
              ))}
            </nav>

            <div className="absolute right-4 flex items-center gap-2">
              <ThemeSwitcher />
              <Link
                href="/auth/login"
                aria-label={t("auth.login")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                <UserRound className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground transition-colors hover:border-primary hover:text-primary md:hidden"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Layers3 className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden border-t border-border bg-card/95 px-4 pb-4`}
        >
          <nav aria-label="Mobile main navigation" className="mt-3 space-y-2">
            {[
              ["nav.home", "#home"],
              ["nav.about", "#about"],
              ["nav.news", "#news"],
              ["nav.projects", "#projects"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(label)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative py-14 px-4 sm:py-20 overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-16 right-16 w-60 h-60 bg-primary rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-16 left-16 w-60 h-60 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <BrandLogo variant="hero" />

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("landing.title")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.tagline")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            <Link href="/auth/sign-up?role=employee">
              <Button className="w-full sm:w-auto px-6 py-3">
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button variant="outline" className="w-full sm:w-auto px-6 py-3">
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-16 px-4 bg-card/50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            {t("landing.features")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-colors">
              <div className="w-11 h-11 bg-primary/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold">
                {t("landing.feature1Title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature1Desc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-colors">
              <div className="w-11 h-11 bg-accent/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold">
                {t("landing.feature2Title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature2Desc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/50 transition-colors">
              <div className="w-11 h-11 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold">
                {t("landing.feature3Title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="news" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            {t("landing.howItWorks")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Employees */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">{t("employee.title")}</h3>
              <ol className="space-y-4">
                {["step1", "step2", "step3"].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {t(`landing.employee_${step}_title`)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t(`landing.employee_${step}_desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Companies */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">{t("company.title")}</h3>
              <ol className="space-y-4">
                {["step1", "step2", "step3"].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-accent/20 text-accent font-semibold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {t(`landing.company_${step}_title`)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t(`landing.company_${step}_desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="projects"
        className="py-16 px-4 bg-gradient-to-r from-primary to-accent scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto space-y-6 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.readyToStart")}
          </h2>

          <p className="text-base opacity-90 max-w-2xl mx-auto">
            {t("landing.ctaDescription")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/sign-up?role=employee">
              <Button variant="secondary" className="px-6 py-3">
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-6 py-3">
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
          <p>
            &copy; 2024 {t("common.logo")}. {t("landing.allRightsReserved")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              {t("landing.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t("landing.terms")}
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Contact us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
