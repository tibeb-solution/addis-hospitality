"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import {
  Globe,
  MessageCircle,
  BriefcaseBusiness,
  Camera,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Footer() {
  const t = useTranslations();
  const pathname = usePathname() || "";
  const isDashboard =
    pathname.startsWith("/employee") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/admin");

  if (isDashboard) return null;

  const currentYear = new Date().getFullYear();

  const navigationLinks = {
    jobSeekers: [
      { label: t("footer.browseJobs") || "Browse Jobs", href: "/jobs" },
      {
        label: t("footer.myApplications") || "My Applications",
        href: "/employee/jobs",
      },
      {
        label: t("footer.savedJobs") || "Saved Jobs",
        href: "/employee/profile",
      },
      { label: t("footer.profile") || "Profile", href: "/employee/profile" },
    ],
    employers: [
      { label: t("footer.postJob") || "Post a Job", href: "/company/jobs" },
      { label: t("footer.recruiterDashboard") || "Dashboard", href: "/admin" },
      {
        label: t("footer.applications") || "Applications",
        href: "/admin/companies",
      },
      {
        label: t("footer.companyProfile") || "Company Profile",
        href: "/company/profile",
      },
    ],
    company: [
      { label: t("footer.about") || "About", href: "/about" },
      { label: t("footer.contact") || "Contact", href: "/contact" },
      { label: t("footer.blog") || "Blog", href: "/news" },
      { label: t("footer.careers") || "Careers", href: "/company" },
    ],
    legal: [
      {
        label: t("footer.privacyPolicy") || "Privacy Policy",
        href: "/privacy",
      },
      {
        label: t("footer.termsOfService") || "Terms of Service",
        href: "/terms",
      },
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
    <footer className="relative overflow-hidden border-t border-emerald-500/20 bg-emerald-950 text-slate-100 shadow-[0_-18px_48px_rgba(16,185,129,0.12)]">
      <div
        className="footer-gradient-motion absolute inset-0"
        aria-hidden="true"
      />
      <div className="footer-line-field absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,78,59,0.82),rgba(2,44,34,0.94))]"
        aria-hidden="true"
      />

      {/* Main Footer Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5 lg:gap-10">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="mb-4 inline-flex items-center justify-center">
              <BrandLogo variant="header" className="h-10 w-auto rounded-md" />
            </div>
            <p className="mb-4 max-w-xs text-xs leading-relaxed text-emerald-50/80">
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-950/40 text-emerald-100/70 transition hover:border-emerald-300/70 hover:bg-emerald-700/30 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t("footer.jobSeekers") || "Job Seekers"}
            </h3>
            <ul className="space-y-2">
              {navigationLinks.jobSeekers.map(({ label, href }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-xs text-emerald-50/70 transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t("footer.employers") || "Employers"}
            </h3>
            <ul className="space-y-2">
              {navigationLinks.employers.map(({ label, href }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-xs text-emerald-50/70 transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t("footer.company") || "Company"}
            </h3>
            <ul className="space-y-2">
              {navigationLinks.company.map(({ label, href }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-xs text-emerald-50/70 transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-white">
              {t("footer.legal") || "Legal"}
            </h3>
            <ul className="space-y-2">
              {navigationLinks.legal.map(({ label, href }) => (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    className="text-xs text-emerald-50/70 transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 border-t border-emerald-300/15 pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href="mailto:addis.hospitalitysolutions@gmail.com"
              className="group flex items-center gap-3 rounded-md border border-emerald-300/15 bg-emerald-950/30 p-3 transition hover:border-emerald-300/60 hover:bg-emerald-800/30"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200 group-hover:bg-emerald-300/25">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-50/55">Email</p>
                <p className="text-sm font-medium text-white">
                  addis.hospitalitysolutions@gmail.com
                </p>
              </div>
            </a>

            <a
              href="tel:+251941248888"
              className="group flex items-center gap-3 rounded-md border border-emerald-300/15 bg-emerald-950/30 p-3 transition hover:border-emerald-300/60 hover:bg-emerald-800/30"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200 group-hover:bg-emerald-300/25">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-50/55">Phone</p>
                <p className="text-sm font-medium text-white">
                  +251 94 124 8888
                </p>
              </div>
            </a>

            <div className="group flex items-center gap-3 rounded-md border border-emerald-300/15 bg-emerald-950/30 p-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-50/55">Location</p>
                <p className="text-sm font-medium text-white">
                  Addis Ababa, Ethiopia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-emerald-300/15 bg-emerald-950/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-xs font-semibold text-white sm:text-sm">
              &copy; {currentYear} Addis Hospitality.{" "}
              {t("footer.copyright") || "All rights reserved."}
            </p>
            <a
              href="https://tibeb-solutions-swda-two.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 transition hover:text-white sm:text-sm"
            >
              <span>Developed </span>
              <span>by Tibeb Solutions</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
