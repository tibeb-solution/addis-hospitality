"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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
                className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-md shadow-md z-50"
              >
                <div className="py-2">
                  <div className="px-2">
                    <LocaleSwitcher />
                  </div>
                  <div className="px-2 mt-2">
                    <ThemeSwitcher />
                  </div>
                  <div className="px-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full text-left"
                    >
                      {t("common.logout")}
                    </Button>
                  </div>
                </div>
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
