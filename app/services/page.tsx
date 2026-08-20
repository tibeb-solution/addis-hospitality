"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Hotel,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function ServicesPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative flex items-center justify-between">
            <Link href="/" className="hover:opacity-90 transition-opacity">
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
            {t("nav.services")}
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover our comprehensive range of services
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            [
              BriefcaseBusiness,
              "Employment agency",
              "Recruitment and placement for hospitality professionals and organizations.",
            ],
            [
              CalendarDays,
              "Event organization",
              "Planning, staffing, and coordination for memorable hospitality and corporate events.",
            ],
            [
              ClipboardCheck,
              "Asset counting systems",
              "Digital asset and stock tracking systems built for hospitality operations.",
            ],
            [
              Hotel,
              "Hospitality operations",
              "Operational support that helps hospitality businesses deliver consistent service.",
            ],
            [
              UsersRound,
              "Workforce coordination",
              "A practical bridge between qualified talent and hospitality employers.",
            ],
          ].map(([Icon, title, description]) => {
            const ServiceIcon = Icon as typeof BriefcaseBusiness;
            return (
              <article
                key={title as string}
                className="rounded-lg border border-border bg-card p-6 sm:p-8"
              >
                <ServiceIcon className="h-8 w-8 text-primary" />
                <h2 className="mt-5 text-xl font-semibold">
                  {title as string}
                </h2>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {description as string}
                </p>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
