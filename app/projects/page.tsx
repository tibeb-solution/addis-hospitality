"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function ProjectsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative flex items-center justify-between">
            <Link
              href="/"
              className="hover:opacity-90 transition-opacity"
            >
              <BrandLogo />
            </Link>

            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          <h1 className="text-4xl font-bold mb-2 text-foreground">
            {t("nav.projects")}
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore our latest projects and work
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            ["landing.feature1Title", "landing.feature1Desc"],
            ["landing.feature2Title", "landing.feature2Desc"],
            ["landing.feature3Title", "landing.feature3Desc"],
            ["landing.howItWorks", "landing.ctaDescription"],
          ].map(([title, description]) => (
            <section
              key={title}
              className="rounded-lg border border-border bg-card p-8"
            >
              <h2 className="text-2xl font-semibold text-foreground">
                {t(title)}
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                {t(description)}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
