"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon } from "lucide-react";
import SideNav from "@/components/side-nav";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/lib/local-storage";
import RequiredPasswordSetup from "@/components/required-password-setup";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localesOpen, setLocalesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkAuth = () => {
      if (isSupabaseConfigured()) {
        const checkSupabaseAuth = async () => {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          const authUser = session?.user;
          if (!authUser) {
            setLoading(false);
            router.push("/auth/login");
            return;
          }
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
          const currentUser = { ...authUser, ...profile, id: authUser.id, email: authUser.email, role: profile?.role ?? authUser.user_metadata?.role ?? "employee", email_verified: true };
          if (currentUser.role !== "company" && currentUser.role !== "admin") {
            setLoading(false);
            router.push("/auth/login");
            return;
          }
          setUser(currentUser);
          setRequiresPassword(
            Boolean(
              authUser.app_metadata?.providers?.includes("google") &&
              !authUser.user_metadata?.password_set,
            ),
          );
          setLoading(false);
        };
        void checkSupabaseAuth();
        return;
      }

      const currentUser = getCurrentUser();

      if (!currentUser) {
        setLoading(false);
        router.push("/auth/login");
        return;
      }

      if (currentUser.role !== "company" && currentUser.role !== "admin") {
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

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await createClient().auth.signOut();
    clearCurrentUser();
    router.push("/auth/login");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // close mobile sidebar on navigation
  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    const loadLogo = async () => {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data?.logo_url) {
          const { data: signed } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.logo_url);
          setLogoUrl(signed.publicUrl || "");
          setAvatarUrl(signed.publicUrl || "");
        }
      } catch (e) {
        // ignore
      }
    };

    loadLogo();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SideNav role="company" />

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

            <div className="flex items-center gap-2 ml-auto relative">
              {logoUrl && (
                <div className="w-10 h-10 rounded overflow-hidden mr-2">
                  <img
                    src={logoUrl}
                    alt="company logo"
                    className="object-cover w-10 h-10"
                  />
                </div>
              )}

              <button
                onClick={() => toggleTheme()}
                title={
                  theme === "dark"
                    ? t("common.lightMode")
                    : t("common.darkMode")
                }
                aria-label={
                  theme === "dark"
                    ? t("common.lightMode")
                    : t("common.darkMode")
                }
                className="inline-flex items-center justify-center rounded-md p-2 border border-border bg-card mr-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <LocaleSwitcher />

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
                    alt="logo"
                    width={36}
                    height={36}
                    className="object-cover w-9 h-9"
                  />
                ) : (
                  <div className="w-9 h-9 bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {(user?.full_name || user?.email || "")[0] || "C"}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-12 w-44 bg-card border border-border rounded-md shadow-md z-50"
                >
                  <ul className="py-1" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 py-8 min-h-[calc(100vh-64px)]">
          <main className="max-w-6xl mx-auto">{children}</main>
        </div>
      </div>

      {sidebarOpen && (
        <SideNav role="company" mobile onClose={() => setSidebarOpen(false)} />
      )}

      {requiresPassword && (
        <RequiredPasswordSetup onComplete={() => setRequiresPassword(false)} />
      )}
    </div>
  );
}
