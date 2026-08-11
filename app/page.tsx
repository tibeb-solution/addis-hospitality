"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav
              aria-label="Main navigation"
              className="mr-2 hidden items-center justify-center gap-8 lg:flex"
            >
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
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher />
              <Link
                href="/auth/login"
                aria-label={t("auth.login")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                <UserRound className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative py-20 px-4 sm:py-32 overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <BrandLogo variant="hero" />

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("landing.title")}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.tagline")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/auth/sign-up?role=employee">
              <Button size="lg" className="w-full sm:w-auto">
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 px-4 bg-card/50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            {t("landing.features")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
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
              <h3 className="text-lg font-semibold">
                {t("landing.feature1Title")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.feature1Desc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent"
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
              <h3 className="text-lg font-semibold">
                {t("landing.feature2Title")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.feature2Desc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <h3 className="text-lg font-semibold">
                {t("landing.feature3Title")}
              </h3>
              <p className="text-muted-foreground">
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
        className="py-20 px-4 bg-gradient-to-r from-primary to-accent scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t("landing.readyToStart")}
          </h2>

          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t("landing.ctaDescription")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up?role=employee">
              <Button size="lg" variant="secondary">
                {t("auth.signUpAsEmployee")}
              </Button>
            </Link>
            <Link href="/auth/sign-up?role=company">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                {t("auth.signUpAsCompany")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            &copy; 2024 {t("common.logo")}. {t("landing.allRightsReserved")}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              {t("landing.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t("landing.terms")}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {t("landing.contact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
