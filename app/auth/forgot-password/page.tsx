"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  findUserByEmail,
  verifySecurityAnswers,
  updateUserPasswordByEmail,
} from "@/lib/local-storage";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [showReset, setShowReset] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email) {
      setError(t("validation.required"));
      setLoading(false);
      return;
    }

    try {
      const user = findUserByEmail(email);
      if (!user) {
        // For privacy, still show success
        setSuccess(true);
        setLoading(false);
        return;
      }

      // If user has security questions, prompt them
      if (user.security_questions && user.security_questions.length >= 3) {
        setPendingEmail(email);
        setQuestions(user.security_questions.map((q) => q.question));
      } else {
        // Fallback to previous localStorage marker
        localStorage.setItem("ah_password_reset_email", email);
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswers = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!pendingEmail) {
        setError(t("errors.unauthorized"));
        setLoading(false);
        return;
      }

      const ok = verifySecurityAnswers(pendingEmail, answers);
      if (!ok) {
        setError(t("auth.securityAnswersIncorrect"));
        setLoading(false);
        return;
      }

      setShowReset(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePasswordInline = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;
      const passwordConfirm = formData.get("passwordConfirm") as string;

      if (!password || !passwordConfirm) {
        setError(t("validation.required"));
        setLoading(false);
        return;
      }

      if (password !== passwordConfirm) {
        setError(t("auth.passwordsMustMatch"));
        setLoading(false);
        return;
      }

      if (!pendingEmail) {
        setError(t("errors.unauthorized"));
        setLoading(false);
        return;
      }

      const ok = updateUserPasswordByEmail(pendingEmail, password);
      if (!ok) {
        setError(t("errors.serverError"));
        setLoading(false);
        return;
      }

      setPendingEmail(null);
      setQuestions(null);
      setShowReset(false);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setLoading(false);
    }
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
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("common.success")}</h2>
              <p className="text-muted-foreground">
                {t("auth.emailVerificationSent")}
              </p>
            </div>
            <Link href="/auth/login">
              <Button className="w-full">{t("auth.login")}</Button>
            </Link>
          </div>
        ) : questions && !showReset ? (
          <form onSubmit={handleVerifyAnswers} className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm">{t("auth.answerSecurityQuestions")}</p>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-sm font-medium">{q}</label>
                <input
                  name={`answer${idx}`}
                  value={answers[idx]}
                  onChange={(e) => {
                    const next = [...answers];
                    next[idx] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder={t("auth.securityAnswerPlaceholder", {
                    number: idx + 1,
                  })}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? t("common.loading") : t("auth.verifyAnswers")}
            </Button>
          </form>
        ) : showReset ? (
          <form onSubmit={handleUpdatePasswordInline} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.password")}
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.passwordConfirm")}
              </label>
              <input
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? t("common.loading") : t("auth.resetPassword")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
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

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? t("common.loading") : t("auth.resetPassword")}
            </Button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center text-sm">
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            {t("common.back")} {t("auth.login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
