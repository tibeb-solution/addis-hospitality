"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { useTheme } from '@/lib/theme-provider'
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import SideNav from "@/components/side-nav";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/lib/local-storage";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      if (currentUser.role !== "employee" && currentUser.role !== "admin") {
        router.push("/auth/error");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    clearCurrentUser();
    router.push("/auth/login");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setSidebarOpen(false), [pathname]);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localesOpen, setLocalesOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { theme, toggleTheme } = useTheme()

  const LOCALES: { key: 'en' | 'am'; label: string; className?: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'am', label: 'አማርኛ', className: 'font-ethiopic' },
  ]

  const setLocale = async (locale: 'en' | 'am') => {
    try {
      const res = await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      if (res.ok) {
        setMenuOpen(false)
        setLocalesOpen(false)
        setTimeout(() => router.refresh(), 100)
      }
    } catch (e) {
      console.error('Failed to change locale', e)
    }
  }

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("employee_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data?.avatar_url) {
          const { data: signed } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_url);
          setAvatarUrl(signed.publicUrl || "");
        }
      } catch (e) {
        // ignore
      }
    };

    loadAvatar();
  }, [user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!menuRef.current || !buttonRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      if (buttonRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 border border-border bg-card"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto relative">
            <button
              onClick={() => { toggleTheme() }}
              title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              className="inline-flex items-center justify-center rounded-md p-1 border border-border bg-card"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <button
              ref={buttonRef}
              onClick={() => setMenuOpen((s) => !s)}
              className="inline-flex items-center justify-center rounded-full overflow-hidden border border-border bg-card p-1"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.full_name || user?.email}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="object-cover w-9 h-9"
                />
              ) : (
                <div className="w-9 h-9 bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {(user?.full_name || user?.email || "")[0] || "U"}
                </div>
              )}
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-12 w-44 bg-card border border-border rounded-md shadow-md z-50"
              >
                <ul className="py-1">
                  <li
                    className="relative"
                    onMouseEnter={() => setLocalesOpen(true)}
                    onMouseLeave={() => setLocalesOpen(false)}
                  >
                    <button
                      onClick={() => setLocalesOpen((s) => !s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 flex items-center justify-between"
                    >
                      <span>Language</span>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {localesOpen && (
                      <ul className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-md shadow-md z-50">
                        {LOCALES.map((opt) => (
                          <li key={opt.key}>
                            <button
                              onClick={() => setLocale(opt.key)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 ${opt.className || ''}`}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>

                  <li>
                    <button
                      onClick={() => { handleLogout() }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10"
                    >
                      {t('common.logout')}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        <SideNav role="employee" />
        <main className="flex-1">{children}</main>
      </div>

      {sidebarOpen && (
        <SideNav role="employee" mobile onClose={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
