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
              <svg
                aria-hidden="true"
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fill="#4285F4"
                  d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.54 13.69a5.85 5.85 0 0 1 0-3.38V7.78H3.3a9.6 9.6 0 0 0 0 8.44l3.24-2.53Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.28c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.38 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z"
                />
              </svg>
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
