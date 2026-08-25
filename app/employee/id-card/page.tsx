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
      {isVerified ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Presentation Section */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 sm:p-6 bg-card/60 backdrop-blur-xs border border-border rounded-2xl shadow-sm">
            <div className="printable-id-card">
              <EmployeeIdCard
                fullName={profile?.full_name || "Addis Employee"}
                position={profile?.desired_position || "Hospitality Professional"}
                idNumber={profile?.id_number}
                email={profile?.email || ""}
                phone={profile?.phone || ""}
                avatarUrl={avatarUrl}
                isVerified={true}
                showControls={true}
              />
            </div>
          </div>

          {/* Badge Specifications & Guidelines */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                Badge Information &amp; Verification
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
                  <dd className="font-bold text-green-600 dark:text-green-400">Official Active Member</dd>
                </div>
              </dl>
            </div>

            {/* Quick Tips */}
            <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Info className="h-4 w-4 text-primary" />
                How to Use Your ID Badge
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                <li>Click <strong>Both Sides</strong> to download a high-resolution PNG image suitable for digital presentation or printing.</li>
                <li>You can click on the badge preview above or use the <strong>Flip</strong> button to inspect the front and back sides.</li>
                <li>Your badge contains a unique barcode encoding your member identity for fast verification at partner venues.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Pending Verification State */
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-lg">
                <ShieldAlert className="h-6 w-6 text-amber-600" />
                ID Badge Unlocks After Verification
              </div>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80 max-w-2xl leading-relaxed">
                Your official Addis Hospitality Solutions ID Badge is generated automatically and will become downloadable once your account and verification documents have been approved by administrators.
              </p>
            </div>
            <Link href="/employee/documents">
              <Button className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <FileUp className="h-4 w-4" />
                Upload Documents
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Verification Steps */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Verification Roadmap</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">Step 1</span>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Profile Information</h3>
                <p className="text-xs text-muted-foreground">
                  Your basic contact and professional details are submitted.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Step 2</span>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Upload Identification</h3>
                <p className="text-xs text-muted-foreground">
                  Submit your National ID, Passport, or Certificates under Documents.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Step 3</span>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Admin Approval</h3>
                <p className="text-xs text-muted-foreground">
                  Admin reviews your files and unlocks your downloadable ID Card.
                </p>
              </div>
            </div>

            {/* Preview of Badge */}
            <div className="border-t border-border pt-6 flex flex-col items-center">
              <p className="text-xs text-muted-foreground font-medium mb-4 text-center">
                Preview of your badge (download unlocked upon verification):
              </p>
              <div className="opacity-75 pointer-events-none scale-90 sm:scale-95 origin-top">
                <EmployeeIdCard
                  fullName={profile?.full_name || "Addis Employee"}
                  position={profile?.desired_position || "Hospitality Professional"}
                  idNumber={profile?.id_number}
                  email={profile?.email || ""}
                  phone={profile?.phone || ""}
                  avatarUrl={avatarUrl}
                  isVerified={false}
                  showControls={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
