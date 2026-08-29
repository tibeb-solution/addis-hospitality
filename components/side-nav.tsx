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
  Bell,
  CreditCard,
  FileUser,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearCurrentUser } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingJobCount, setPendingJobCount] = useState(0);

  useEffect(() => {
    if (role !== "company" || !isSupabaseConfigured()) return;
    const loadUnread = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setUnreadCount(count || 0);
    };
    void loadUnread();
    const timer = window.setInterval(() => void loadUnread(), 10000);
    return () => window.clearInterval(timer);
  }, [role]);

  useEffect(() => {
    if (role !== "admin") return;
    const loadPendingJobs = async () => {
      const { count } = await createClient()
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("status", "pending_review");
      setPendingJobCount(count || 0);
    };
    void loadPendingJobs();
  }, [role]);

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
          { href: "/admin/settings", label: t("nav.settings"), icon: Settings },
        ]
      : role === "employee"
        ? [
            {
              href: "/employee",
              label: t("nav.dashboard"),
              icon: Home,
            },
            {
              href: "/employee/id-card",
              label: "ID Card",
              icon: CreditCard,
            },
            {
              href: "/employee/cv",
              label: "My CV",
              icon: FileUser,
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
            {
              href: "/employee/settings",
              label: t("nav.settings"),
              icon: Settings,
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
              href: "/company/notifications",
              label: "Notifications",
              icon: Bell,
            },
            {
              href: "/company/documents",
              label: t("nav.documents"),
              icon: Archive,
            },
            {
              href: "/company/settings",
              label: t("nav.settings"),
              icon: Settings,
            },
          ];

  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!mobile) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      closeRef.current?.focus({ preventScroll: true });
    }, 50);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [mobile, onClose]);

  const navContent = (
    <>
      {mobile && (
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="absolute right-3 top-3 p-2 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-3 pr-8">
        <Link
          href={
            role === "employee"
              ? "/employee"
              : role === "admin"
                ? "/admin"
                : "/company"
          }
          onClick={() => {
            if (mobile) onClose?.();
          }}
          className="hover:opacity-90 transition-opacity shrink-0"
        >
          <BrandLogo />
        </Link>
        <div>
          <h3 className="font-semibold text-base text-foreground leading-tight">
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
                  onClick={() => {
                    if (mobile) onClose?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 transition text-sm font-medium ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.href === "/company/notifications" && unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                  {item.href === "/admin/jobs" && pendingJobCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                      {pendingJobCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="space-y-2 border-t border-border pt-4 mt-auto">
        <button
          type="button"
          onClick={() => {
            if (mobile) onClose?.();
            clearCurrentUser();
            router.push("/auth/login");
          }}
          className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 transition text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-sm font-medium cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div
        className="fixed inset-0 z-[100] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 z-[101] bg-black/60 backdrop-blur-xs sidebar-overlay-fade"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <aside
          className="fixed inset-y-0 left-0 z-[102] w-72 max-w-[85vw] h-full h-[100dvh] overflow-y-auto bg-card text-foreground border-r border-border p-6 gap-6 sidebar-slide-in flex flex-col shadow-2xl"
          aria-label="Navigation sidebar"
        >
          {navContent}
        </aside>
      </div>
    );
  }

  return (
    <aside
      className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen w-72 shrink-0 bg-card text-foreground border-r border-border p-6 gap-6 overflow-y-auto"
      aria-label="Sidebar navigation"
    >
      {navContent}
    </aside>
  );
}
