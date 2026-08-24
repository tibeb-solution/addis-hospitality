"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  UserRound,
  X,
  Menu,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Hotel,
  UsersRound,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="shrink-0 hover:opacity-90 transition-opacity"
            >
              <BrandLogo />
            </Link>

            <nav aria-label="Main navigation" className="hidden md:flex gap-8">
              {[
                ["nav.home", "#home"],
                ["nav.about", "/about"],
                ["nav.news", "/news"],
                ["nav.services", "/services"],
                ["nav.projects", "/projects"],
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

            <div className="ml-auto flex min-w-0 items-center justify-end gap-1 sm:gap-2">
              <ThemeSwitcher />
              <LocaleSwitcher />
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
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden border-t border-border bg-card/95 px-3 pb-3 shadow-lg`}
        >
          <nav aria-label="Mobile main navigation" className="pt-2 space-y-1">
            {[
              ["nav.home", "#home"],
              ["nav.about", "/about"],
              ["nav.news", "/news"],
              ["nav.services", "/services"],
              ["nav.projects", "/projects"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
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
        className="relative py-10 px-4 sm:py-14 md:py-20 overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-8 sm:top-16 right-8 sm:right-16 w-32 h-32 sm:w-60 sm:h-60 bg-primary rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl"></div>
          <div className="absolute bottom-8 sm:bottom-16 left-8 sm:left-16 w-32 h-32 sm:w-60 sm:h-60 bg-accent rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 text-center">
          <BrandLogo variant="hero" />

          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("landing.title")}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.tagline")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center pt-4 sm:pt-6">
            <Link href="/auth/sign-up?role=employee">
              <Button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-20 px-4 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-16">
            {t("landing.howItWorks")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
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

      {/* Services Section */}
      <section className="border-y border-border bg-card/60 px-4 py-12 sm:py-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Our services
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                Practical hospitality support, from people to operations.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                We help hospitality businesses find the right people, run
                memorable events, and keep their operations organized with
                dependable systems.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Explore all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BriefcaseBusiness,
                title: "Employment agency",
                description:
                  "Recruitment and placement for hotels, restaurants, resorts, events, and other hospitality teams.",
              },
              {
                icon: CalendarDays,
                title: "Event organization",
                description:
                  "Planning, coordination, staffing, and guest-ready execution for hospitality and corporate events.",
              },
              {
                icon: ClipboardCheck,
                title: "Asset counting systems",
                description:
                  "Simple digital tools for tracking hospitality assets, stock, equipment, and operational accountability.",
              },
              {
                icon: Hotel,
                title: "Hospitality operations",
                description:
                  "Practical support that helps hospitality organizations improve daily service and operational consistency.",
              },
              {
                icon: UsersRound,
                title: "Workforce coordination",
                description:
                  "Connect qualified professionals with the right opportunities and help teams grow with confidence.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/50"
              >
                <Icon className="h-7 w-7 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-primary to-accent scroll-mt-20">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 text-center text-primary-foreground">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {t("landing.readyToStart")}
          </h2>

          <p className="text-sm sm:text-base opacity-90 max-w-2xl mx-auto">
            {t("landing.ctaDescription")}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Link href="/auth/sign-up?role=employee">
              <Button
                variant="secondary"
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
