"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import {
  Globe,
  MessageCircle,
  BriefcaseBusiness,
  Camera,
  Mail,
  Phone,
  MapPin,
  Heart,
} from "lucide-react";

export function Footer() {
  const t = useTranslations();

  const currentYear = new Date().getFullYear();

  const navigationLinks = {
    jobSeekers: [
      { label: t("footer.browseJobs") || "Browse Jobs", href: "/jobs" },
      { label: t("footer.myApplications") || "My Applications", href: "/employee/jobs" },
      { label: t("footer.savedJobs") || "Saved Jobs", href: "/employee/profile" },
      { label: t("footer.profile") || "Profile", href: "/employee/profile" },
    ],
    employers: [
      { label: t("footer.postJob") || "Post a Job", href: "/company/jobs" },
      { label: t("footer.recruiterDashboard") || "Dashboard", href: "/admin" },
      { label: t("footer.applications") || "Applications", href: "/admin/companies" },
      { label: t("footer.companyProfile") || "Company Profile", href: "/company/profile" },
    ],
    company: [
      { label: t("footer.about") || "About", href: "/about" },
      { label: t("footer.contact") || "Contact", href: "/contact" },
      { label: t("footer.blog") || "Blog", href: "/news" },
      { label: t("footer.careers") || "Careers", href: "/company" },
    ],
    legal: [
      { label: t("footer.privacyPolicy") || "Privacy Policy", href: "/privacy" },
      { label: t("footer.termsOfService") || "Terms of Service", href: "/terms" },
      { label: t("footer.cookiePolicy") || "Cookie Policy", href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Globe, href: "#facebook", label: "Facebook" },
    { icon: MessageCircle, href: "#twitter", label: "X / Twitter" },
    { icon: BriefcaseBusiness, href: "#linkedin", label: "LinkedIn" },
    { icon: Camera, href: "#instagram", label: "Instagram" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),rgba(2,6,23,0.74)] text-slate-100 shadow-[0_-20px_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.88),rgba(15,23,42,0.7),rgba(15,23,42,0.88))]" aria-hidden="true" />

      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="mb-6 inline-flex items-center justify-center">
              <BrandLogo variant="header" className="h-12 w-auto rounded-md" />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-300/90">
              {t("footer.tagline") ||
                "Connect hospitality professionals with exceptional opportunities across Ethiopia. Grow your career, build your business."}
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 transition hover:border-emerald-500 hover:bg-slate-800 hover:text-emerald-500"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-1">
            <h3 className="mb-4 font-semibold text-white">
              {t("footer.jobSeekers") || "Job Seekers"}
            </h3>
            <ul className="space-y-3">
              {navigationLinks.jobSeekers.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition hover:text-emerald-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-4 font-semibold text-white">
              {t("footer.employers") || "Employers"}
            </h3>
            <ul className="space-y-3">
              {navigationLinks.employers.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition hover:text-emerald-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-4 font-semibold text-white">
              {t("footer.company") || "Company"}
            </h3>
            <ul className="space-y-3">
              {navigationLinks.company.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition hover:text-emerald-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-4 font-semibold text-white">
              {t("footer.legal") || "Legal"}
            </h3>
            <ul className="space-y-3">
              {navigationLinks.legal.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition hover:text-emerald-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="my-12 border-t border-slate-800 pt-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <a
              href="mailto:info@addishospitality.com"
              className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition hover:border-emerald-500 hover:bg-slate-900/60"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-500 group-hover:bg-emerald-600/30">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-100">
                  info@addishospitality.com
                </p>
              </div>
            </a>

            <a
              href="tel:+251941248888"
              className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition hover:border-emerald-500 hover:bg-slate-900/60"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-500 group-hover:bg-emerald-600/30">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium text-slate-100">+251 94 124 8888</p>
              </div>
            </a>

            <div className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-500">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-100">Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {currentYear} Addis Hospitality. {t("footer.copyright") || "All rights reserved."}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-500 transition hover:text-emerald-400"
            >
              <span>{t("footer.builtBy") || "Built with"}</span>
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span>{t("footer.forTheIndustry") || "for the hospitality industry"}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
