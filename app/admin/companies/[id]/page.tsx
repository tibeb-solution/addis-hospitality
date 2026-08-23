"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { logAction } from "@/lib/local-storage";

export default function AdminCompanyDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [company, setCompany] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      const supabase = createClient();
      const companyId = String(params.id || "");
      const [
        { data, error: companyError },
        { data: account, error: accountError },
        { data: docs, error: documentsError },
      ] = await Promise.all([
        supabase
          .from("company_profiles")
          .select("*")
          .eq("id", companyId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, email, full_name, phone, status, created_at")
          .eq("id", companyId)
          .maybeSingle(),
        supabase.from("documents").select("*").eq("owner_id", companyId),
      ]);

      if (companyError || accountError || documentsError) {
        setError(
          companyError?.message ||
            accountError?.message ||
            documentsError?.message ||
            "Unable to load company details.",
        );
        setLoading(false);
        return;
      }

      if (data) {
        setCompany({ ...account, ...data });
        setReviewNote(data.review_note || "");

        if (data.logo_url) {
          try {
            const { data: signed } = await supabase.storage
              .from("avatars")
              .getPublicUrl(data.logo_url);
            setLogoUrl(signed.publicUrl || "");
            setLogoStatus(data.logo_status || null);
          } catch (e) {
            // ignore
          }
        }

        setDocuments(docs || []);
      }
      setLoading(false);
    };

    loadCompany();
  }, [params]);

  const handleVerifyChange = async (verified: boolean) => {
    if (!company) return;
    setUpdating(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("company_profiles")
        .update({
          is_verified: verified,
          review_note: reviewNote,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", company.id);

      if (updateError) throw updateError;

      const { error: accountError } = await supabase
        .from("profiles")
        .update({
          status: verified ? "active" : "pending",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", company.id);

      if (accountError) throw accountError;

      setCompany({
        ...company,
        is_verified: verified,
        status: verified ? "active" : "pending",
      });
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
          review_note: reviewNote,
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
                review_note: reviewNote,
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

  if (!company) {
    return <div>{t("admin.noResults")}</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {logoUrl && (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img
                src={logoUrl}
                alt="logo"
                className="object-cover w-12 h-12 sm:w-16 sm:h-16"
              />
            </div>
          )}
          <h1 className="text-xl sm:text-3xl font-bold break-words">
            {company.company_name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            size="sm"
            className="text-xs sm:text-sm"
          >
            {t("common.back")}
          </Button>
          {logoUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={async () => {
                  try {
                    await createClient()
                      .from("company_profiles")
                      .update({
                        logo_status: "approved",
                      })
                      .eq("id", params.id as string);
                    setLogoStatus("approved");
                    logAction(
                      (await createClient().auth.getUser()).data.user?.id ||
                        "admin",
                      "approve_logo",
                      params.id as string,
                      {},
                    );
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Approve Logo
              </button>
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={async () => {
                  try {
                    await createClient()
                      .from("company_profiles")
                      .update({
                        logo_status: "rejected",
                      })
                      .eq("id", params.id as string);
                    setLogoStatus("rejected");
                    logAction(
                      (await createClient().auth.getUser()).data.user?.id ||
                        "admin",
                      "reject_logo",
                      params.id as string,
                      {},
                    );
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Reject Logo
              </button>
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={async () => {
                  try {
                    await createClient()
                      .from("company_profiles")
                      .update({
                        logo_url: null,
                        logo_status: null,
                      })
                      .eq("id", params.id as string);
                    setLogoUrl(null);
                    setLogoStatus(null);
                    logAction(
                      (await createClient().auth.getUser()).data.user?.id ||
                        "admin",
                      "delete_logo",
                      params.id as string,
                      {},
                    );
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Delete Logo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("company.basicInfo")}</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("auth.companyName")}</dt>
              <dd className="font-medium">{company.company_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("auth.businessType")}
              </dt>
              <dd className="font-medium">
                {t(`taxonomy.business_${company.business_type}`) || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("company.tradeLicenseNumber")}
              </dt>
              <dd className="font-medium">
                {company.trade_license_number || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("company.tinNumber")}
              </dt>
              <dd className="font-medium">{company.tin_number || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("company.contactPhone")}
              </dt>
              <dd className="font-medium">{company.contact_phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("company.contactEmail")}
              </dt>
              <dd className="font-medium text-xs">
                {company.contact_email || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Verification Controls */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("admin.action")}</h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("admin.verificationStatus")}
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  company.is_verified
                    ? "bg-green-500/20 text-green-700"
                    : "bg-yellow-500/20 text-yellow-700"
                }`}
              >
                {company.is_verified
                  ? t("company.verified")
                  : t("company.verifyPending")}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("admin.statusNote")}
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
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

            <div className="flex gap-2">
              {!company.is_verified && (
                <Button
                  onClick={() => handleVerifyChange(true)}
                  disabled={updating}
                  className="flex-1"
                >
                  {t("admin.approve")}
                </Button>
              )}
              {company.is_verified && (
                <Button
                  onClick={() => handleVerifyChange(false)}
                  disabled={updating}
                  variant="destructive"
                  className="flex-1"
                >
                  {t("admin.reject")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete company profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Contact and location</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Account email", company.email],
              ["Account phone", company.phone],
              ["Contact person", company.contact_person],
              ["Contact position", company.contact_position],
              ["Contact phone", company.contact_phone],
              ["Contact email", company.contact_email],
              ["Region", company.region],
              ["Sub-city", company.sub_city],
              ["Address", company.address],
              ["Website", company.website],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Business details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Year established", company.year_established],
              ["Employee count", company.employee_count],
              ["Trade license number", company.trade_license_number],
              ["TIN number", company.tin_number],
              ["Logo status", company.logo_status],
              ["Registered", company.created_at ? new Date(company.created_at).toLocaleString() : null],
              ["Reviewed", company.reviewed_at ? new Date(company.reviewed_at).toLocaleString() : null],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {company.description && <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{company.description}</p>}
        </div>
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
    </div>
  );
}
