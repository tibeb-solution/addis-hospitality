"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  findUserByEmail,
  generatePasswordResetCode,
  updateUserPasswordByEmail,
  verifyPasswordResetCode,
} from "@/lib/local-storage";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");

  const handleRequestCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();

    if (!email) {
      setError(t("validation.required") || "Email is required.");
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured()) {
        const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccess(true);
        }
        setLoading(false);
        return;
      }

      const user = findUserByEmail(email);
      const normalizedEmail = email.trim().toLowerCase();

      if (!user) {
        setPendingEmail(normalizedEmail);
        const demoCode = generatePasswordResetCode(normalizedEmail);
        setResetCode(demoCode);
        setStep("code");
        setLoading(false);
        return;
      }

      setPendingEmail(normalizedEmail);
      const code = generatePasswordResetCode(normalizedEmail);
      setResetCode(code);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") || "").trim();

    if (!pendingEmail) {
      setError(t("errors.unauthorized") || "Session expired. Please request a new code.");
      setLoading(false);
      return;
    }

    if (!verifyPasswordResetCode(pendingEmail, code)) {
      setError("Invalid code. Please try again.");
      setLoading(false);
      return;
    }

    setStep("password");
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");

    if (!pendingEmail) {
      setError(t("errors.unauthorized") || "Session expired. Please request a new code.");
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

    const ok = updateUserPasswordByEmail(pendingEmail, password);
    if (!ok) {
      setError(t("errors.serverError") || "Unable to update password.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setStep("success");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">{t("auth.resetPassword")}</p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("common.success")}</h2>
              <p className="text-muted-foreground">Your password has been reset successfully.</p>
            </div>
            <Link href="/auth/login">
              <Button className="w-full">{t("auth.login")}</Button>
            </Link>
          </div>
        ) : step === "email" ? (
          <form onSubmit={handleRequestCode} className="space-y-6">
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

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? t("common.loading") : "Send reset code"}
            </Button>
          </form>
        ) : step === "code" ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{pendingEmail}</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                Demo code for local mode: <span className="font-mono font-semibold text-foreground">{resetCode}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification code</label>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? t("common.loading") : "Verify code"}
            </Button>
          </form>
        ) : step === "password" ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
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
        ) : null}

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            {t("common.back")} {t("auth.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
