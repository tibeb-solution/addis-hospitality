"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Role = "employee" | "company";

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  const [role, setRole] = useState<Role>("employee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add the public Supabase variables to .env.local.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const next = role === "company" ? "/company" : "/employee";
      const { error: oauthError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}&next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          ← {t("common.back")} {t("common.logo")}
        </Link>

        <div className="space-y-2 text-center">
          <BrandLogo variant="auth" />
          <p className="text-muted-foreground">Create your account with Google</p>
        </div>

        <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t("auth.selectRole")}</label>
            <div className="flex gap-3">
              {(["employee", "company"] as const).map((candidateRole) => (
                <button
                  key={candidateRole}
                  type="button"
                  disabled={loading}
                  onClick={() => setRole(candidateRole)}
                  className={`flex-1 rounded-lg px-4 py-3 font-medium transition-all ${role === candidateRole ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
                >
                  {candidateRole === "employee" ? t("auth.signUpAsEmployee") : t("auth.signUpAsCompany")}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Continue with Google to create a verified account. No email, password, or other signup form is required.
          </p>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="button" disabled={loading} onClick={handleGoogleSignUp} className="w-full" size="lg">
            {loading ? t("common.loading") : "Continue with Google"}
          </Button>
        </div>

        <div className="text-center text-sm">
          {t("auth.alreadyHaveAccount")} {" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">{t("auth.login")}</Link>
        </div>
      </div>
    </div>
  );
}
