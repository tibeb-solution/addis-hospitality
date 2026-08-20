"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function AdminEmployeesPage() {
  const t = useTranslations();
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")
        .order("created_at", { ascending: false });

      // attach avatar public URLs when available
      const enriched = await Promise.all(
        (data || []).map(async (emp: any) => {
          try {
            const { data: profile } = await supabase
              .from("employee_profiles")
              .select("*")
              .eq("id", emp.id)
              .single();
            if (profile?.avatar_url) {
              const { data: signed } = supabase.storage
                .from("avatars")
                .getPublicUrl(profile.avatar_url);
              return {
                ...emp,
                ...profile,
                avatarUrl: signed.publicUrl || "",
              };
            }
            if (profile) return { ...emp, ...profile };
          } catch (e) {
            // ignore
          }
          return emp;
        }),
      );

      setEmployees(enriched);
      setFiltered(enriched);
      setLoading(false);
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    let results = employees;

    if (search) {
      results = results.filter(
        (emp) =>
          emp.email.toLowerCase().includes(search.toLowerCase()) ||
          emp.full_name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter) {
      results = results.filter((emp) => emp.status === statusFilter);
    }

    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      results = results.filter((emp) =>
        [emp.preferred_cities, emp.location, emp.region, emp.sub_city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(location)),
      );
    }

    if (professionFilter) {
      const profession = professionFilter.toLowerCase();
      results = results.filter((emp) =>
        [emp.desired_position, emp.profession, emp.job_title]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(profession)),
      );
    }

    if (experienceFilter) {
      results = results.filter((emp) => {
        const years = Number(emp.years_experience);
        if (!Number.isFinite(years)) return false;
        if (experienceFilter === "0-2") return years <= 2;
        if (experienceFilter === "3-5") return years >= 3 && years <= 5;
        if (experienceFilter === "6-10") return years >= 6 && years <= 10;
        return years >= 11;
      });
    }

    setFiltered(results);
  }, [
    search,
    statusFilter,
    locationFilter,
    professionFilter,
    experienceFilter,
    employees,
  ]);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("admin.employeeList")}</h1>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              {t("admin.searchEmployee")}
            </label>
            <input
              placeholder={t("admin.searchEmployee")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              {t("admin.accountStatus")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground"
            >
              <option value="">{t("admin.filterBy")}</option>
              <option value="active">{t("taxonomy.status_active")}</option>
              <option value="pending">{t("taxonomy.status_pending")}</option>
              <option value="suspended">
                {t("taxonomy.status_suspended")}
              </option>
              <option value="rejected">{t("taxonomy.status_rejected")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Location</label>
            <input
              placeholder="Search location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Profession</label>
            <input
              placeholder="Search profession"
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">
              Experience years
            </label>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-input rounded-md bg-background text-foreground"
            >
              <option value="">Any experience</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="11+">11+ years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
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
                    {t("auth.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("auth.fullName")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.registrationDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("documents.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    {t("admin.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      {emp.avatarUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={emp.avatarUrl}
                            alt="avatar"
                            width={40}
                            height={40}
                            className="object-cover w-10 h-10"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{emp.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {emp.full_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {emp.created_at
                        ? new Date(emp.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          emp.status === "active"
                            ? "bg-green-500/20 text-green-700"
                            : emp.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-700"
                              : emp.status === "suspended"
                                ? "bg-orange-500/20 text-orange-700"
                                : "bg-red-500/20 text-red-700"
                        }`}
                      >
                        {t(`taxonomy.status_${emp.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/employees/${emp.id}`}>
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
