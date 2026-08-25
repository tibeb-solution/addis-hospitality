"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { logAction } from "@/lib/local-storage";
import { formatEmployeeId } from "@/lib/employee-id";
import EmployeeIdCard from "@/components/employee-id-card";
import { CreditCard } from "lucide-react";

export default function AdminEmployeeDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployee = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id as string)
        .single();

      if (data) {
        setEmployee(data);
        setStatusNote(data.status_note || "");
        // Load documents for this employee so admins can review uploads
        const { data: docs } = await supabase
          .from("documents")
          .select("*")
          .eq("owner_id", params.id as string);

        setDocuments(docs || []);
        // Load employee/company profile avatar (if available)
        try {
          const { data: profile } = await supabase
            .from("employee_profiles")
            .select("*")
            .eq("id", params.id as string)
            .single();

          if (profile) {
            setEmployee((current: any) => ({ ...current, ...profile }));
          }
          if (profile?.avatar_url) {
            const { data: signed } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            setAvatarUrl(signed.publicUrl || "");
            setAvatarStatus(profile.avatar_status || null);
          }
        } catch (e) {
          // ignore if no employee profile exists
        }
      }
      setLoading(false);
    };

    loadEmployee();
  }, [params]);

  const handleStatusChange = async (newStatus: string) => {
    if (!employee) return;
    setUpdating(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          status: newStatus,
          status_note: statusNote,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", employee.id);

      if (updateError) throw updateError;

      setEmployee({ ...employee, status: newStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentStatus = async (
    documentId: string,
    status: "approved" | "rejected",
  ) => {
    setUpdating(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          review_note: statusNote,
        })
        .eq("id", documentId);
      if (updateError) throw updateError;
      setDocuments((items) =>
        items.map((item) =>
          item.id === documentId
            ? {
                ...item,
                status,
                reviewed_at: new Date().toISOString(),
                review_note: statusNote,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  if (!employee) {
    return <div>{t("admin.noResults")}</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {avatarUrl && (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img
                src={avatarUrl}
                alt="avatar"
                width={64}
                height={64}
                className="object-cover w-12 h-12 sm:w-16 sm:h-16"
              />
            </div>
          )}
          <h1 className="text-xl sm:text-3xl font-bold break-words">
            {employee.full_name || employee.email}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {avatarStatus && (
            <span className="text-xs sm:text-sm px-2 py-1 rounded bg-muted whitespace-nowrap">
              {avatarStatus}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={async () => {
                try {
                  await createClient()
                    .from("employee_profiles")
                    .update({
                      avatar_status: "approved",
                    })
                    .eq("id", params.id as string);
                  setAvatarStatus("approved");
                  logAction(
                    (await createClient().auth.getUser()).data.user?.id ||
                      "admin",
                    "approve_avatar",
                    params.id as string,
                    {},
                  );
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Approve
            </button>
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={async () => {
                try {
                  await createClient()
                    .from("employee_profiles")
                    .update({
                      avatar_status: "rejected",
                    })
                    .eq("id", params.id as string);
                  setAvatarStatus("rejected");
                  logAction(
                    (await createClient().auth.getUser()).data.user?.id ||
                      "admin",
                    "reject_avatar",
                    params.id as string,
                    {},
                  );
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Reject
            </button>
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={async () => {
                try {
                  await createClient()
                    .from("employee_profiles")
                    .update({
                      avatar_url: null,
                      avatar_status: null,
                    })
                    .eq("id", params.id as string);
                  setAvatarUrl(null);
                  setAvatarStatus(null);
                  logAction(
                    (await createClient().auth.getUser()).data.user?.id ||
                      "admin",
                    "delete_avatar",
                    params.id as string,
                    {},
                  );
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("auth.email")}</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
              {formatEmployeeId(employee.id_number, employee.email || employee.id)}
            </span>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Employee ID Number</dt>
              <dd className="font-mono font-bold text-primary">
                {formatEmployeeId(employee.id_number, employee.email || employee.id)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("auth.email")}</dt>
              <dd className="font-medium">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("auth.fullName")}</dt>
              <dd className="font-medium">{employee.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("auth.phone")}</dt>
              <dd className="font-medium">{employee.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("admin.accountStatus")}
              </dt>
              <dd
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  employee.status === "active"
                    ? "bg-green-500/20 text-green-700"
                    : employee.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-700"
                      : employee.status === "suspended"
                        ? "bg-orange-500/20 text-orange-700"
                        : "bg-red-500/20 text-red-700"
                }`}
              >
                {t(`taxonomy.status_${employee.status}`)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("admin.registrationDate")}
              </dt>
              <dd className="font-medium">
                {new Date(employee.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Personal and professional details */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Personal details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Gender", employee.gender],
              ["Date of birth", employee.date_of_birth],
              ["Age", employee.age],
              ["Alternative phone", employee.alternative_phone],
              ["Residence city", employee.residence_city],
              ["Sub-city", employee.residence_sub_city],
              ["Woreda", employee.residence_woreda],
              ["Area", employee.residence_area],
              ["Emergency contact", employee.emergency_contact_name],
              ["Relationship", employee.emergency_contact_relationship],
              ["Emergency phone", employee.emergency_contact_phone],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Professional details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Desired position", employee.desired_position],
              ["Years of experience", employee.years_experience],
              ["Preferred cities", employee.preferred_cities],
              ["Expected salary", employee.expected_salary_min || employee.expected_salary_max ? `${employee.expected_salary_min || "—"} – ${employee.expected_salary_max || "—"} ETB` : null],
              ["Highest education", employee.highest_education],
              ["Employment type", employee.employment_type],
              ["Availability", employee.availability],
              ["Willing to relocate", employee.willing_to_relocate === true ? "Yes" : employee.willing_to_relocate === false ? "No" : null],
              ["Skills", Array.isArray(employee.skills) ? employee.skills.join(", ") : employee.skills],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {employee.bio && <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{employee.bio}</p>}
        </div>

        {/* Moderation Controls */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("admin.action")}</h3>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("admin.statusNote")}
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
                rows={3}
                placeholder={t("admin.statusNote")}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {employee.status !== "active" && (
                <Button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  className="flex-1"
                >
                  {t("admin.approve")}
                </Button>
              )}
              {employee.status !== "rejected" && (
                <Button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={updating}
                  variant="destructive"
                  className="flex-1"
                >
                  {t("admin.reject")}
                </Button>
              )}
              {employee.status !== "suspended" && (
                <Button
                  onClick={() => handleStatusChange("suspended")}
                  disabled={updating}
                  variant="outline"
                  className="flex-1"
                >
                  {t("admin.suspend")}
                </Button>
              )}
              {employee.status === "suspended" && (
                <Button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  className="flex-1"
                >
                  {t("admin.reactivate")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Info */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">{t("admin.auditLog")}</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("admin.approvedAt")}</dt>
            <dd className="font-medium">
              {employee.status === "active" && employee.reviewed_at
                ? new Date(employee.reviewed_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("admin.reviewedAt")}</dt>
            <dd className="font-medium">
              {employee.reviewed_at
                ? new Date(employee.reviewed_at).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("nav.documents")}</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 border border-border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`taxonomy.doc_${doc.document_type}`)} -{" "}
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm text-primary underline"
                    onClick={async () => {
                      const { data, error } = await createClient()
                        .storage.from("documents")
                        .createSignedUrl(doc.file_path, 3600);
                      if (error) return;
                      if (data?.signedUrl)
                        window.open(
                          data.signedUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                    }}
                  >
                    View
                  </button>
                  {doc.status !== "approved" && (
                    <button
                      type="button"
                      disabled={updating}
                      className="text-sm text-green-700 underline"
                      onClick={() =>
                        void handleDocumentStatus(doc.id, "approved")
                      }
                    >
                      Verify
                    </button>
                  )}
                  {doc.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={updating}
                      className="text-sm text-red-700 underline"
                      onClick={() =>
                        void handleDocumentStatus(doc.id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.status === "approved"
                        ? "bg-green-500/20 text-green-700"
                        : doc.status === "rejected"
                          ? "bg-red-500/20 text-red-700"
                          : "bg-yellow-500/20 text-yellow-700"
                    }`}
                  >
                    {t(`taxonomy.doc_status_${doc.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official ID Badge Preview for Admin */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Official Member ID Card Badge</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Auto-generated from employee credentials
          </span>
        </div>
        <div className="flex justify-center py-4 bg-muted/20 rounded-xl border border-border/50">
          <EmployeeIdCard
            fullName={employee.full_name || employee.email}
            position={employee.desired_position || "Hospitality Professional"}
            idNumber={employee.id_number}
            email={employee.email}
            phone={employee.phone || "—"}
            avatarUrl={avatarUrl}
            isVerified={employee.status === "active"}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
}
