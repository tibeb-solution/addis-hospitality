"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { updateEmployeeProfile, logAction } from "@/lib/local-storage";
import { Button } from "@/components/ui/button";
// use plain <img> for avatars (data URLs / local storage friendly)

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

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  if (!employee) {
    return <div>{t("admin.noResults")}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {avatarUrl && (
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
              <img
                src={avatarUrl}
                alt="avatar"
                width={64}
                height={64}
                className="object-cover w-16 h-16"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold">
            {employee.full_name || employee.email}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {avatarStatus && (
            <span className="text-sm px-2 py-1 rounded bg-muted">
              {avatarStatus}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={async () => {
                try {
                  await updateEmployeeProfile(params.id as string, {
                    avatar_status: "approved",
                  });
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
                  await updateEmployeeProfile(params.id as string, {
                    avatar_status: "rejected",
                  });
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
                  await updateEmployeeProfile(params.id as string, {
                    avatar_url: null,
                    avatar_status: null,
                  });
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
          <h3 className="font-semibold">{t("auth.email")}</h3>
          <dl className="space-y-3 text-sm">
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
                  <a
                    href={`/api/local-files/${doc.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    View
                  </a>
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
    </div>
  );
}
