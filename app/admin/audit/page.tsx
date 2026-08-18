"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function AdminAuditLogPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      const supabase = createClient();

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, status, reviewed_at, created_at")
        .order("reviewed_at", { ascending: false })
        .limit(100);

      const { data: companies } = await supabase
        .from("company_profiles")
        .select("id, email, company_name, is_verified, reviewed_at, created_at")
        .order("reviewed_at", { ascending: false })
        .limit(100);

      const employeeLogs =
        profiles
          ?.filter((profile: any) => profile.role === "employee")
          .map((emp: any) => ({
            id: `employee-${emp.id}-${emp.reviewed_at || emp.created_at || "unknown"}`,
            user: emp.email,
            action: emp.reviewed_at ? "status_change" : "signup",
            details: `Status: ${emp.status}`,
            timestamp: emp.reviewed_at || emp.created_at,
            approvedAt: emp.status === "active" ? emp.reviewed_at : null,
            reviewedAt: emp.reviewed_at,
            status: emp.status,
          })) || [];

      const companyLogs =
        companies?.map((company: any) => ({
          id: `company-${company.id}-${company.reviewed_at || company.created_at || "unknown"}`,
          user: company.email || company.company_name || "—",
          action: company.reviewed_at ? "status_change" : "signup",
          details: company.is_verified
            ? "Company verification: approved"
            : "Company verification: pending",
          timestamp: company.reviewed_at || company.created_at,
          approvedAt: company.is_verified ? company.reviewed_at : null,
          reviewedAt: company.reviewed_at,
        })) || [];

      const auditLogs = [...employeeLogs, ...companyLogs].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setLogs(auditLogs);
      setFiltered(auditLogs);
      setLoading(false);
    };

    loadLogs();
  }, []);

  useEffect(() => {
    let results = logs;

    if (search) {
      results = results.filter((log) =>
        log.user.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (actionFilter) {
      results = results.filter((log) => log.action === actionFilter);
    }

    setFiltered(results);
  }, [search, actionFilter, logs]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("admin.auditLog")}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("admin.searchUser")}
            </label>
            <input
              placeholder={t("admin.searchUser")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.action")}</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t("admin.filterBy")}</option>
              <option value="signup">{t("auth.signUp")}</option>
              <option value="status_change">{t("admin.statusChange")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t("admin.noResults")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.timestamp")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.action")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.approvedAt")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.reviewedAt")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.details")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{log.user}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                        {log.action === "signup"
                          ? t("auth.signUp")
                          : t("admin.statusChange")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {log.approvedAt
                        ? new Date(log.approvedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {log.reviewedAt
                        ? new Date(log.reviewedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.details}
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
