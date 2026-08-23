"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function AdminCompaniesPage() {
  const t = useTranslations();
  const [companies, setCompanies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");

  useEffect(() => {
    const loadCompanies = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*");

      if (error) {
        console.error("Unable to load companies", error);
        setLoading(false);
        return;
      }

      const companyIds = (data || []).map((company: any) => company.id);
      const { data: accounts } = companyIds.length
        ? await supabase
            .from("profiles")
            .select("id, email, full_name, status, created_at")
            .in("id", companyIds)
        : { data: [] };
      const accountsById = new Map(
        (accounts || []).map((account: any) => [account.id, account]),
      );

      // Attach account metadata and public logo URLs without querying columns
      // that do not exist on company_profiles.
      const enriched = (data || [])
        .map((comp: any) => {
        const account = accountsById.get(comp.id) || {};
        if (comp.logo_url) {
          try {
            const { data: signed } = supabase.storage
              .from("avatars")
              .getPublicUrl(comp.logo_url);
            return { ...account, ...comp, avatarUrl: signed.publicUrl || "" };
          } catch {
            return { ...account, ...comp };
          }
        }
        return { ...account, ...comp };
      })
        .sort((a: any, b: any) =>
          String(b.created_at || "").localeCompare(String(a.created_at || "")),
        );

      setCompanies(enriched);
      setFiltered(enriched);
      setLoading(false);
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    let results = companies;

    if (search) {
      results = results.filter((comp) =>
        comp.company_name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (verifiedFilter) {
      results = results.filter((comp) =>
        verifiedFilter === "verified" ? comp.is_verified : !comp.is_verified,
      );
    }

    setFiltered(results);
  }, [search, verifiedFilter, companies]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("admin.companyList")}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              {t("admin.searchCompany")}
            </label>
            <input
              placeholder={t("admin.searchCompany")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              {t("admin.verificationStatus")}
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t("admin.filterBy")}</option>
              <option value="verified">{t("company.verified")}</option>
              <option value="pending">{t("company.verifyPending")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-4 sm:p-8 text-center text-muted-foreground text-sm">
            {t("admin.noResults")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-125">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    &nbsp;
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("auth.companyName")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("auth.businessType")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.registrationDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.verificationStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      {comp.avatarUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={comp.avatarUrl}
                            alt="logo"
                            width={40}
                            height={40}
                            className="object-cover w-10 h-10"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {comp.company_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {comp.business_type
                        ? t.has(`taxonomy.business_${comp.business_type}`)
                          ? t(`taxonomy.business_${comp.business_type}`)
                          : comp.business_type
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {comp.created_at
                        ? new Date(comp.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          comp.is_verified
                            ? "bg-green-500/20 text-green-700"
                            : "bg-yellow-500/20 text-yellow-700"
                        }`}
                      >
                        {comp.is_verified
                          ? t("company.verified")
                          : t("company.verifyPending")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/companies/${comp.id}`}>
                        <Button variant="outline" size="sm">
                          {t("admin.viewDetails")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
