"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { updateUserPasswordByEmail, verifyPasswordResetCode } from "@/lib/local-storage";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const pending = localStorage.getItem("ah_password_reset_email");
    if (!pending) {
      setError(t("errors.unauthorized") || "Reset session not found.");
    } else {
      setPendingEmail(pending);
    }
    setSessionChecked(true);
  }, [t]);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") || "").trim();
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");

    if (!pendingEmail) {
      setError(t("errors.unauthorized") || "Reset session not found.");
      setLoading(false);
      return;
    }

    if (!code) {
      setError("Verification code is required.");
      setLoading(false);
      return;
    }

    if (!verifyPasswordResetCode(pendingEmail, code)) {
      setError("Invalid code. Please request a fresh reset email.");
      setLoading(false);
      return;
    }

    if (!password || !passwordConfirm) {
      setError(t("validation.required") || "Password is required.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError(t("auth.passwordsMustMatch") || "Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t("auth.passwordTooShort") || "Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const ok = updateUserPasswordByEmail(pendingEmail, password);
      if (!ok) {
        setError(t("errors.serverError") || "Unable to update password.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("ah_password_reset_email");
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error && !pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-destructive">{error}</h2>
          </div>
          <Link href="/auth/forgot-password">
            <Button className="w-full">Request reset code</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">{t("auth.resetPassword")}</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification code</label>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.password")}</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.passwordConfirm")}</label>
            <input
              name="passwordConfirm"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? t("common.loading") : t("auth.resetPassword")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            {t("common.back")} {t("auth.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
