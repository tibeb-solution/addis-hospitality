"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Briefcase,
  FileText,
  Users,
  Archive,
  Grid,
  X,
  Settings,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { clearCurrentUser } from "@/lib/local-storage";

export default function SideNav({
  role = "company",
  mobile = false,
  onClose,
}: {
  role?: string;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const items: { href: string; label: string; icon: any }[] =
    role === "admin"
      ? [
          { href: "/admin", label: t("admin.dashboard"), icon: Grid },
          {
            href: "/admin/employees",
            label: t("admin.employeeList"),
            icon: Users,
          },
          {
            href: "/admin/companies",
            label: t("admin.companyList"),
            icon: Briefcase,
          },
          { href: "/admin/jobs", label: "Job Approvals", icon: FileText },
          { href: "/admin/audit", label: t("admin.auditLog"), icon: Archive },
        ]
      : role === "employee"
        ? [
            {
              href: "/employee",
              label: t("nav.dashboard"),
              icon: Home,
            },
            { href: "/employee/jobs", label: "Jobs", icon: Briefcase },
            {
              href: "/employee/schedule",
              label: "Schedule & notifications",
              icon: CalendarDays,
            },
            {
              href: "/employee/documents",
              label: t("nav.documents"),
              icon: FileText,
            },
          ]
        : [
            {
              href: "/company",
              label: t("nav.dashboard"),
              icon: Home,
            },
            { href: "/company/jobs", label: "Jobs", icon: Briefcase },
            {
              href: "/company/applications",
              label: "Applications",
              icon: FileText,
            },
            {
              href: "/company/documents",
              label: t("nav.documents"),
              icon: Archive,
            },
          ];

  const base = mobile
    ? "fixed inset-0 z-50"
    : "hidden md:flex md:sticky md:top-0 md:h-screen";
  const panel = mobile
    ? "w-72 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-6 gap-6 sidebar-slide-in flex flex-col"
    : "flex-col w-72 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-6 gap-6";

  const closeRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!mobile) return;
    // focus the close button for keyboard users
    const timer = setTimeout(() => {
      closeRef.current?.focus();
    }, 80);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [mobile, onClose]);

  return (
    <div className={`${base} ${mobile ? "" : ""}`}>
      {mobile && (
        <div
          className="absolute inset-0 bg-black/40 sidebar-overlay-fade"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`${panel} ${mobile ? "relative" : ""}`}
        aria-hidden={!mobile ? undefined : false}
      >
        {mobile && (
          <button
            ref={closeRef}
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-md border border-border bg-card text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <Link
            href={
              role === "employee"
                ? "/employee"
                : role === "admin"
                  ? "/admin"
                  : "/company"
            }
            className="hover:opacity-90 transition-opacity"
          >
            <BrandLogo />
          </Link>
          <div className="hidden sm:block">
            <h3 className="font-semibold text-lg text-sidebar-primary-foreground">
              {role === "admin" ? t("admin.title") : t("nav.dashboard")}
            </h3>
          </div>
        </div>

        <nav
          className="flex-1 mt-4"
          role="navigation"
          aria-label={t("nav.dashboard")}
        >
          <ul className="space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    ref={firstLinkRef}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 w-full rounded-md px-3 py-2 transition ${active ? "bg-sidebar-accent/30 text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent/10"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings and Logout Buttons - Fixed at bottom */}
        <div className="space-y-2 border-t border-sidebar-border pt-4 mt-auto">
          <Link
            href={
              role === "employee"
                ? "/employee/settings"
                : role === "admin"
                  ? "/admin/settings"
                  : "/company/settings"
            }
            className="flex items-center gap-3 w-full rounded-md px-3 py-2 transition text-sidebar-foreground hover:bg-sidebar-accent/10"
          >
            <Settings className="h-4 w-4" />
            <span>{t("nav.settings")}</span>
          </Link>
          <button
            onClick={() => {
              clearCurrentUser();
              router.push("/auth/login");
            }}
            className="flex items-center gap-3 w-full rounded-md px-3 py-2 transition text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
