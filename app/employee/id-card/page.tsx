"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentUser, getEmployeeProfile } from "@/lib/local-storage";
import EmployeeIdCard from "@/components/employee-id-card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileCheck2,
  FileUp,
  ArrowRight,
  Info,
  Copy,
  Check,
} from "lucide-react";

export default function EmployeeIdCardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        const { data: employeeData } = await supabase
          .from("employee_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        const merged = {
          ...authUser,
          ...profileData,
          ...employeeData,
          id: authUser.id,
          email: authUser.email,
        };

        setProfile(merged);

        if (employeeData?.avatar_url) {
          const { data: signed } = supabase.storage
            .from("avatars")
            .getPublicUrl(employeeData.avatar_url);
          setAvatarUrl(signed.publicUrl || "");
        }
      } else {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }

        const empProfile = getEmployeeProfile(currentUser.id);
        const merged = {
          ...currentUser,
          ...empProfile,
        };

        setProfile(merged);
        setAvatarUrl(empProfile?.avatar_url || null);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const copyId = () => {
    if (!profile?.id_number) return;
    navigator.clipboard.writeText(profile.id_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const isVerified = profile?.status === "active" || profile?.is_verified === true;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Digital ID Card
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                Pending Verification
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official Addis Hospitality Solutions Member Identification Badge
          </p>
        </div>

        {profile?.id_number && (
          <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">ID Number:</span>
            <code className="text-sm font-bold font-mono text-primary">{profile.id_number}</code>
            <button
              type="button"
              onClick={copyId}
              title="Copy ID Number"
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Card Presentation & Download Section */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 bg-card/60 backdrop-blur-xs border border-border rounded-2xl shadow-sm">
          <div className="printable-id-card">
            <EmployeeIdCard
              fullName={profile?.full_name || "Addis Employee"}
              position={profile?.desired_position || "Hospitality Professional"}
              idNumber={profile?.id_number}
              email={profile?.email || ""}
              phone={profile?.phone || ""}
              avatarUrl={avatarUrl}
              isVerified={isVerified}
              showControls={true}
            />
          </div>
        </div>

        {/* Badge Specifications & Verification Status */}
        <div className="lg:col-span-6 space-y-6">
          {!isVerified && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Account Verification in Progress
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                Your ID card and barcode are generated with your credentials. You can download and test it below. Upload your identification documents for official administrator approval.
              </p>
              <Link href="/employee/documents" className="inline-block">
                <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs">
                  <FileUp className="h-3.5 w-3.5" />
                  Upload Verification Documents
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Badge Information &amp; Credentials
            </h2>

            <dl className="space-y-3 text-sm divide-y divide-border/60">
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Full Name</dt>
                <dd className="font-semibold text-foreground">{profile?.full_name || "—"}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Designation</dt>
                <dd className="font-semibold text-foreground">{profile?.desired_position || "Hospitality Professional"}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Member ID</dt>
                <dd className="font-mono font-bold text-primary">{profile?.id_number || "—"}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Official Email</dt>
                <dd className="font-medium text-foreground">{profile?.email || "—"}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Phone Number</dt>
                <dd className="font-medium text-foreground">{profile?.phone || "—"}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-muted-foreground">Verification Status</dt>
                <dd className="font-bold text-green-600 dark:text-green-400">
                  {isVerified ? "Official Active Member" : "Verification Pending"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Tips */}
          <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
              <Info className="h-4 w-4 text-primary" />
              How to Download &amp; Use Your ID Badge
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
              <li>Click <strong>Front (PNG)</strong> or <strong>Back (PNG)</strong> to download individual high-res sides.</li>
              <li>Click <strong>Both Sides</strong> to download a complete side-by-side PNG card image.</li>
              <li>Click <strong>Print ID Badge</strong> for a printer-ready format.</li>
              <li>Click the card directly or use the <strong>Flip</strong> button to toggle between the front and back.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
