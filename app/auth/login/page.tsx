"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncAuthenticatedUser } from "@/lib/auth";
import { findUserByEmail, setCurrentUser } from "@/lib/local-storage";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError(t("validation.required"));
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError || !data.user) {
          setError(signInError?.message || t("auth.invalidCredentials"));
          setLoading(false);
          return;
        }

        const user = await syncAuthenticatedUser(data.user, supabase);
        router.push(user.role === "admin" ? "/admin" : user.role === "company" ? "/company" : "/employee");
        return;
      }

      const user = findUserByEmail(normalizedEmail);

      if (!user) {
        setError(t("auth.invalidCredentials"));
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setError(t("auth.invalidCredentials"));
        setLoading(false);
        return;
      }
      if (user.email_verified !== true) {
        localStorage.setItem("ah_pending_verification_email", user.email);
        const pendingCode = localStorage.getItem("ah_pending_verification_code");
        if (pendingCode) {
          localStorage.setItem("ah_pending_verification_code", pendingCode);
        }
        router.push("/auth/sign-up-success");
        setLoading(false);
        return;
      }

      // Set current user and route based on role
      setCurrentUser({ ...user, email: user.email.trim() });

      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "company") {
        router.push("/company");
      } else {
        router.push("/employee");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← {t("common.back")} {t("common.logo")}
        </Link>

        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">{t("auth.login")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.email")}</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.password")}</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword ? t("auth.hidePassword") : t("auth.showPassword")
                }
                className="absolute inset-y-0 right-2 inline-flex items-center p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? t("common.loading") : t("auth.login")}
          </Button>

          {isSupabaseConfigured() && (
            <Button type="button" variant="outline" disabled={loading} onClick={handleGoogleLogin} className="w-full" size="lg">
              Continue with Google
            </Button>
          )}

          <Link href="/auth/sign-up" className="block w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
            >
              {t("auth.signUp")}
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
}
