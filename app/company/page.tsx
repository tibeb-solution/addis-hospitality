"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function CompanyDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data || null);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-4 sm:p-8 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
          {t("company.title")}
        </h1>
        <p className="text-sm sm:text-base opacity-90">
          {t("landing.tagline")}
        </p>
      </div>

      {/* Profile Status */}
      {!profile ? (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 text-center space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t("company.noProfileYet")}
          </h2>
          <p className="text-muted-foreground">{t("company.approval")}</p>
          <Link href="/company/profile">
            <Button size="lg">{t("nav.profile")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Verification Status */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("company.verified")}</h3>
            <div className="space-y-2">
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_verified
                    ? "bg-green-500/20 text-green-700"
                    : "bg-yellow-500/20 text-yellow-700"
                }`}
              >
                {profile.is_verified
                  ? t("company.verified")
                  : t("company.verifyPending")}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("company.basicInfo")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("company.legalInfo")}
            </p>
            <Link href="/company/profile" className="block">
              <Button variant="outline" className="w-full">
                {t("common.edit")}
              </Button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("nav.documents")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("documents.uploadDocument")}
            </p>
            <Link href="/company/documents" className="block">
              <Button variant="outline" className="w-full">
                {t("common.view")}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("company.basicInfo")}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("auth.companyName")}
                </dt>
                <dd className="font-medium">{profile.company_name || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("auth.businessType")}
                </dt>
                <dd className="font-medium">
                  {t(`taxonomy.business_${profile.business_type}`) || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.tradeLicenseNumber")}
                </dt>
                <dd className="font-medium">
                  {profile.trade_license_number || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.tinNumber")}
                </dt>
                <dd className="font-medium">{profile.tin_number || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("company.contactInfo")}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.contactPerson")}
                </dt>
                <dd className="font-medium">{profile.contact_person || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.contactPhone")}
                </dt>
                <dd className="font-medium">{profile.contact_phone || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.contactEmail")}
                </dt>
                <dd className="font-medium text-xs">
                  {profile.contact_email || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("company.website")}
                </dt>
                <dd className="font-medium text-xs">
                  {profile.website || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
