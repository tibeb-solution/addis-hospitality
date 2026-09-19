"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentUser, getEmployeeProfiles } from "@/lib/local-storage";
import {
  employeeQualificationScore,
  qualificationLevel,
  recruitment,
} from "@/lib/recruitment";

function formatText(value?: string | null) {
  if (!value) return "Not provided";
  return value;
}

export default function CompanyEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sortBy, setSortBy] = useState("best_match");

  const loadEmployees = async () => {
    try {
      const supabase = createClient();
      const currentUser = isSupabaseConfigured()
        ? (await supabase.auth.getUser()).data.user
        : getCurrentUser();
      setUser(currentUser);

      if (!currentUser) return;

      let rows: any[] = [];
      if (isSupabaseConfigured()) {
        const [
          { data: profiles, error: profilesError },
          { data: employeeProfiles, error: employeeError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("role", "employee"),
          supabase.from("employee_profiles").select("*"),
        ]);
        if (profilesError) throw profilesError;
        if (employeeError) throw employeeError;

        const byId = new Map(
          (employeeProfiles || []).map((profile: any) => [profile.id, profile]),
        );
        rows = (profiles || []).map((profile: any) => {
          const extraProfile = (byId.get(profile.id) ?? {}) as Record<
            string,
            any
          >;
          return {
            ...extraProfile,
            id: profile.id,
            full_name:
              profile.full_name || extraProfile["full_name"] || "Employee",
          };
        });
      } else {
        rows = getEmployeeProfiles().map((profile: any) => ({
          ...profile,
          full_name: profile.full_name || "Employee",
        }));
      }

      const ratings = await recruitment.ratings().catch(() => []);

      try {
        const companyRequests = await recruitment.hiringRequests();
        setRequestedIds(
          companyRequests
            .filter(
              (request) =>
                request.company_id === currentUser.id &&
                request.status === "pending_approval",
            )
            .map((request) => request.employee_id),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Hiring requests could not be loaded.",
        );
      }

      const normalized = rows
        .filter((employee) => employee && employee.id)
        .map((employee) => {
          const score = employeeQualificationScore(employee);
          const adminRating = ratings.find(
            (rating) => rating.subject_id === employee.id,
          );
          return {
            ...employee,
            qualificationScore: score,
            qualificationLevel: qualificationLevel(score),
            adminRating: adminRating?.score ?? null,
          };
        })
        .sort(
          (a, b) => (b.qualificationScore ?? 0) - (a.qualificationScore ?? 0),
        );

      setEmployees(normalized);
      setFiltered(normalized);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load employees.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    const terms = search.trim().toLowerCase();
    let results = employees;

    if (terms) {
      results = results.filter((employee) => {
        const haystack = [
          employee.full_name,
          employee.desired_position,
          employee.highest_education,
          employee.bio,
          Array.isArray(employee.skills)
            ? employee.skills.join(" ")
            : employee.skills,
          Array.isArray(employee.languages)
            ? employee.languages.join(" ")
            : employee.languages,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(terms);
      });
    }

    if (positionFilter) {
      results = results.filter(
        (employee) => employee.desired_position === positionFilter,
      );
    }

    if (educationFilter) {
      results = results.filter(
        (employee) => employee.highest_education === educationFilter,
      );
    }

    if (experienceFilter) {
      const years = Number(experienceFilter);
      results = results.filter((employee) => {
        const current = Number(employee.years_experience || 0);
        return years === 0 ? current === 0 : current >= years;
      });
    }

    if (languageFilter) {
      results = results.filter((employee) => {
        const languages = Array.isArray(employee.languages)
          ? employee.languages
          : [];
        return languages.some(
          (language: string) =>
            language.toLowerCase() === languageFilter.toLowerCase(),
        );
      });
    }

    if (genderFilter) {
      results = results.filter(
        (employee) =>
          String(employee.gender || "").toLowerCase() ===
          genderFilter.toLowerCase(),
      );
    }

    if (sortBy === "highest_rated") {
      results = [...results].sort(
        (a, b) => (b.qualificationScore ?? 0) - (a.qualificationScore ?? 0),
      );
    } else {
      results = [...results].sort((a, b) => {
        const scoreDiff =
          (b.qualificationScore ?? 0) - (a.qualificationScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.years_experience ?? 0) - (a.years_experience ?? 0);
      });
    }

    setFiltered(results);
  }, [
    employees,
    search,
    positionFilter,
    educationFilter,
    experienceFilter,
    languageFilter,
    genderFilter,
    sortBy,
  ]);

  const positions = useMemo(
    () => [
      ...new Set(
        employees.map((employee) => employee.desired_position).filter(Boolean),
      ),
    ],
    [employees],
  );
  const educations = useMemo(
    () => [
      ...new Set(
        employees.map((employee) => employee.highest_education).filter(Boolean),
      ),
    ],
    [employees],
  );
  const languages = useMemo(
    () => [
      ...new Set(
        employees
          .flatMap((employee) =>
            Array.isArray(employee.languages) ? employee.languages : [],
          )
          .filter(Boolean),
      ),
    ],
    [employees],
  );

  const requestHire = async (employeeId: string) => {
    if (!user) {
      setNotice("Please log in to request a hire.");
      return;
    }

    try {
      await recruitment.createHiringRequest({
        company_id: user.id,
        employee_id: employeeId,
      });
      setRequestedIds((current) => [...current, employeeId]);
      setNotice("Hiring request sent. The admin will review and approve it.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to send the hiring request.",
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Loading employees...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <h1 className="text-3xl font-bold">Find employees</h1>
        <p className="mt-1 text-muted-foreground">
          Filter by qualification, experience, skills, and language to shortlist
          candidates safely.
        </p>
      </div>

      {notice && (
        <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          {notice}
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee or skill"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          <select
            value={educationFilter}
            onChange={(event) => setEducationFilter(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All education</option>
            {educations.map((education) => (
              <option key={education} value={education}>
                {education}
              </option>
            ))}
          </select>
          <select
            value={experienceFilter}
            onChange={(event) => setExperienceFilter(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All experience</option>
            <option value="1">1+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
          </select>
          <select
            value={languageFilter}
            onChange={(event) => setLanguageFilter(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All languages</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="best_match">Best match</option>
            <option value="highest_rated">Highest qualification first</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No employee matches your filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((employee) => (
            <article
              key={employee.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {(employee.full_name || "E").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {employee.full_name || "Employee"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {formatText(employee.desired_position)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                      Qualification score: {employee.qualificationScore}/100
                    </span>
                    {employee.adminRating !== null && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-700">
                        Admin rating: {employee.adminRating}/5
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-1 text-foreground">
                      {employee.qualificationLevel}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-foreground">
                      {employee.years_experience ?? 0} years experience
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-foreground">
                      {formatText(employee.highest_education)}
                    </span>
                  </div>

                  <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Gender
                      </dt>
                      <dd className="text-foreground">
                        {formatText(employee.gender)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Languages
                      </dt>
                      <dd className="text-foreground">
                        {Array.isArray(employee.languages)
                          ? employee.languages.join(", ")
                          : formatText(employee.languages)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Skills
                      </dt>
                      <dd className="text-foreground">
                        {Array.isArray(employee.skills)
                          ? employee.skills.slice(0, 3).join(", ")
                          : formatText(employee.skills)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Location
                      </dt>
                      <dd className="text-foreground">
                        {[
                          employee.residence_city,
                          employee.residence_sub_city,
                          employee.residence_area,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </dd>
                    </div>
                  </dl>

                  {employee.bio && (
                    <p className="max-w-2xl text-sm text-foreground/80">
                      {employee.bio}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => void requestHire(employee.id)}
                    disabled={requestedIds.includes(employee.id)}
                  >
                    {requestedIds.includes(employee.id)
                      ? "Hiring request sent"
                      : "Request hire"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Phone, email, and emergency contact details remain private.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
