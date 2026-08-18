"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import SideNav from "@/components/side-nav";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/lib/local-storage";

export default function AdminLayout({
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
        setLoading(false);
        router.push("/auth/login");
        return;
      }

      if (currentUser.role !== "admin") {
        setLoading(false);
        router.push("/auth/login");
        return;
      }

      if (currentUser.email_verified !== true) {
        setLoading(false);
        router.push("/auth/login");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SideNav role="admin" />

      <div className="flex-1 min-w-0">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 min-h-[56px]">
            <div className="md:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-md p-2 border border-border bg-card"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <ThemeSwitcher />
              <LocaleSwitcher />
            </div>
          </div>
        </header>

        <div className="px-2 sm:px-4 py-4 sm:py-8 min-h-[calc(100vh-56px)]">
          <main className="max-w-6xl mx-auto">{children}</main>
        </div>
      </div>

      {sidebarOpen && (
        <SideNav role="admin" mobile onClose={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
