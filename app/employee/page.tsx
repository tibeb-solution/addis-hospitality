"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { CreditCard, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import { formatEmployeeId } from "@/lib/employee-id";
import { getEmployeeWorkflow } from "@/lib/employee-workflow";

export default function EmployeeDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cv, setCv] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const { data: employeeData, error: employeeError } = await supabase
        .from("employee_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (employeeError) throw employeeError;

      const resolvedStatus = profileData?.status || employeeData?.status || "active";
      const merged = {
        ...user,
        ...profileData,
        ...employeeData,
        status: resolvedStatus,
        is_verified: resolvedStatus === "active" || Boolean(profileData?.is_verified) || Boolean(employeeData?.is_verified),
      };

      setProfile(merged);

      if (employeeData?.avatar_url) {
        const { data: signed } = supabase.storage
          .from("avatars")
          .getPublicUrl(employeeData.avatar_url);
        setAvatarUrl(signed.publicUrl || "");
      }
      if (employeeData) {
        calculateCompleteness(employeeData);
      }
      const [{ data: cvData }, { data: documentData }] = await Promise.all([
        supabase.from("employee_cvs").select("status").eq("employee_id", user.id).maybeSingle(),
        supabase.from("documents").select("document_type,holder_type,status").eq("owner_id", user.id),
      ]);
      setCv(cvData);
      setDocuments(documentData || []);

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const calculateCompleteness = (data: any) => {
    const fields = [
      data.bio,
      data.phone,
      data.highest_education,
      data.years_experience,
      data.employment_type,
      data.desired_position,
      data.availability,
      data.willing_to_relocate !== null,
    ];
    const completed = fields.filter(Boolean).length;
    const percentage = (completed / fields.length) * 100;
    setCompleteness(Math.round(percentage));
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  const workflow = getEmployeeWorkflow(profile, cv, documents);
  const isVerified = workflow.every((step) => step.complete);
  const completedSteps = workflow.filter((step) => step.complete).length;
  const idNumber = formatEmployeeId(profile?.id_number, profile?.email || profile?.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 sm:p-8 text-primary-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t("employee.title")}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base opacity-90">
            {t("landing.tagline")}
          </p>
        </div>
        {avatarUrl ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted shadow-md flex-shrink-0 border-2 border-white/40">
            <img
              src={avatarUrl}
              alt="avatar"
              width={80}
              height={80}
              className="object-cover w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>
        ) : null}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-bold">Your verification journey</h2><p className="text-sm text-muted-foreground">{completedSteps} of {workflow.length} steps complete</p></div>
          <span className="text-2xl font-bold text-primary">{Math.round((completedSteps / workflow.length) * 100)}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedSteps / workflow.length) * 100}%` }} /></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {workflow.map((step) => <Link key={step.key} href={step.href} className="rounded-xl border border-border p-3 transition hover:border-primary"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{step.label}</span><span className="text-xs text-muted-foreground">{step.status}</span></div></Link>)}
        </div>
      </section>

      {/* ID Card Banner Widget */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 bg-[#004838]/10 text-[#004838] dark:text-emerald-400 rounded-2xl flex-shrink-0">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                Official Member Digital ID Badge
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Ready to Download
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="h-3 w-3" />
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Member ID: <code className="font-mono font-bold text-primary">{idNumber}</code> • Includes unique barcode &amp; credentials
            </p>
          </div>
        </div>

        {isVerified ? <Link href="/employee/id-card">
          <Button variant="default" className="gap-2 shrink-0">
            <CreditCard className="h-4 w-4" />
            {isVerified ? "Download ID Card" : "View ID Badge"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link> : <Button variant="outline" disabled className="shrink-0"><Clock className="h-4 w-4" />Complete verification</Button>}
      </div>

      {/* Profile Status */}
      {!profile ? (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 text-center space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t("employee.noProfileYet")}
          </h2>
          <p className="text-muted-foreground">
            {t("employee.profileIncomplete")}
          </p>
          <Link href="/employee/profile">
            <Button size="lg">{t("nav.profile")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Completeness Card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">
              {t("employee.profileCompleteness")}
            </h3>
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-accent h-3 rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {completeness}% {t("common.complete")}
              </p>
            </div>
            <Link href="/employee/profile" className="block">
              <Button variant="outline" className="w-full">
                {t("common.edit")}
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("employee.experience")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("employee.addExperience")}
            </p>
            <Link href="/employee/profile?tab=experience" className="block">
              <Button variant="outline" className="w-full">
                {t("common.view")}
              </Button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("nav.documents")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("documents.uploadDocument")}
            </p>
            <Link href="/employee/documents" className="block">
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
            <h3 className="font-semibold">{t("employee.personalInfo")}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.desiredPosition")}
                </dt>
                <dd className="font-medium">
                  {profile.desired_position || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.yearsExperience")}
                </dt>
                <dd className="font-medium">
                  {profile.years_experience || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.highestEducation")}
                </dt>
                <dd className="font-medium">
                  {profile.highest_education || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.employmentType")}
                </dt>
                <dd className="font-medium">
                  {profile.employment_type || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">{t("employee.jobPreferences")}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.availability")}
                </dt>
                <dd className="font-medium">{profile.availability || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.willingToRelocate")}
                </dt>
                <dd className="font-medium">
                  {profile.willing_to_relocate
                    ? t("common.yes")
                    : t("common.no")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.preferredCities")}
                </dt>
                <dd className="font-medium">
                  {profile.preferred_cities || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("employee.expectedSalaryMin")}
                </dt>
                <dd className="font-medium">
                  {profile.expected_salary_min || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
