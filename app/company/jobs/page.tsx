"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCompanyProfile, getCurrentUser, updateCompanyProfile } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Job,
  formatDeadlineDate,
  formatDeadlineCountdown,
  recruitment,
} from "@/lib/recruitment";
import { WORK_SECTORS, getPositionsForSector } from "@/lib/employee-positions";
import PositionSearchSelect from "@/components/position-search-select";
import LanguageMultiSelect from "@/components/language-multi-select";
import { LANGUAGES } from "@/lib/languages";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function statusLabel(status: Job["status"]) {
  return status.replace("_", " ");
}

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCount, setApplicationCount] = useState<
    Record<string, number>
  >({});
  const [user, setUser] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [businessType, setBusinessType] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLanguages, setJobLanguages] = useState<string[]>([]);

  const refresh = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const current = isSupabaseConfigured() ? session?.user : getCurrentUser();
    setUser(current);
    const [companyJobs, applications] = await Promise.all([
      recruitment.jobs(),
      recruitment.applications(),
    ]);
    const companyProfile = isSupabaseConfigured()
      ? (await supabase.from("company_profiles").select("business_type").eq("id", current?.id).maybeSingle()).data
      : getCompanyProfile(current?.id || "");
    setBusinessType(companyProfile?.business_type || "");
    setJobs(
      companyJobs
        .filter((job) => job.company_id === current?.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
    setApplicationCount(
      applications.reduce<Record<string, number>>((counts, application) => {
        counts[application.job_id] = (counts[application.job_id] || 0) + 1;
        return counts;
      }, {}),
    );
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const profile = isSupabaseConfigured()
      ? (
          await createClient()
            .from("company_profiles")
            .select("company_name, business_type")
            .eq("id", user.id)
            .maybeSingle()
        ).data
      : getCompanyProfile(user.id);
    const selectedBusinessType = profile?.business_type || businessType;
    const minAge = Number(data.get("min_age") || 0);
    const maxAge = Number(data.get("max_age") || 0);
    if (minAge < 18 || maxAge < minAge) {
      setNotice("Enter a valid age range. Minimum age must be at least 18 and cannot exceed maximum age.");
      return;
    }
    if (!getPositionsForSector(selectedBusinessType).includes(String(data.get("title") || ""))) {
      setNotice("Update your company profile to choose Cafe or Restaurant before creating a job.");
      return;
    }

    try {
      if (selectedBusinessType !== profile?.business_type) {
        if (isSupabaseConfigured()) {
          const { error: profileError } = await createClient()
            .from("company_profiles")
            .update({ business_type: selectedBusinessType })
            .eq("id", user.id);
          if (profileError) throw profileError;
        } else {
          updateCompanyProfile(user.id, { business_type: selectedBusinessType });
        }
      }
      await recruitment.createJob({
        company_id: user.id,
        company_name: profile?.company_name || user.full_name,
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        location: String(data.get("location") || ""),
        employment_type: String(data.get("employment_type") || "full_time"),
        experience_required: Number(data.get("experience_required") || 0),
        min_age: minAge,
        max_age: maxAge,
        gender_preference: String(data.get("gender_preference") || "") || undefined,
        education_required:
          String(data.get("education_required") || "") || undefined,
        skills: String(data.get("skills") || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        languages: jobLanguages,
        salary_min: data.get("salary_min")
          ? Number(data.get("salary_min"))
          : undefined,
        salary_max: data.get("salary_max")
          ? Number(data.get("salary_max"))
          : undefined,
        application_deadline:
          String(data.get("application_deadline") || "") || undefined,
        status: "pending_review",
      });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to submit job.",
      );
      return;
    }

    form.reset();
    setJobTitle("");
    setJobLanguages([]);
    setNotice(
      "Job submitted to admin review. Employees will see it after approval.",
    );
    await refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Submit vacancies for admin approval, then track applications once they
          are live.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2"
      >
        <h2 className="text-xl font-semibold md:col-span-2">
          Submit a job for review
        </h2>
        <select
          value={businessType}
          required
          onChange={(event) => {
            setBusinessType(event.target.value);
            setJobTitle("");
          }}
          className={fieldClass}
        >
          <option value="">Choose Cafe or Restaurant first</option>
          {WORK_SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector === "cafe" ? "Cafe" : "Restaurant"}
            </option>
          ))}
        </select>
        <PositionSearchSelect
          name="title"
          value={jobTitle}
          positions={getPositionsForSector(businessType)}
          required
          placeholder="Search listed job positions, e.g. barista"
          onChange={setJobTitle}
        />
        <input
          required
          name="location"
          placeholder="e.g. Addis Ababa, Bole"
          className={fieldClass}
        />
        <select name="employment_type" className={fieldClass}>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="office_hours">Office hours</option>
          <option value="contract">Contract</option>
        </select>
        <input
          name="experience_required"
          type="number"
          min="0"
          defaultValue="0"
          placeholder="e.g. 2 years required"
          className={fieldClass}
        />
        <input required name="min_age" type="number" min="18" max="100" defaultValue="18" placeholder="Minimum age, e.g. 18" className={fieldClass} />
        <input required name="max_age" type="number" min="18" max="100" defaultValue="65" placeholder="Maximum age, e.g. 65" className={fieldClass} />
        <select name="gender_preference" defaultValue="" className={fieldClass}>
          <option value="">No gender preference</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select
          name="education_required"
          defaultValue=""
          className={fieldClass}
        >
          <option value="">Education level required (optional)</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="tvet">TVET</option>
          <option value="diploma">Diploma</option>
          <option value="bachelor">Bachelor's</option>
          <option value="master">Master's</option>
          <option value="doctorate">Doctorate</option>
        </select>
        <input
          name="skills"
          placeholder="e.g. customer service, POS, teamwork"
          className={fieldClass}
        />
        <LanguageMultiSelect
          name="languages"
          value={jobLanguages}
          languages={LANGUAGES}
          onChange={setJobLanguages}
          placeholder="Search required languages, e.g. English"
        />
        <input
          name="salary_min"
          type="number"
          min="0"
          placeholder="e.g. 8000 ETB monthly minimum"
          className={fieldClass}
        />
        <input
          name="salary_max"
          type="number"
          min="0"
          placeholder="e.g. 15000 ETB monthly maximum"
          className={fieldClass}
        />
        <input name="application_deadline" type="date" className={fieldClass} aria-label="Application deadline (optional)" />
        <textarea
          required
          name="description"
          placeholder="Describe responsibilities, requirements, schedule, and benefits"
          className={`${fieldClass} min-h-28 md:col-span-2`}
        />
        <div className="flex items-center gap-3 md:col-span-2">
          <Button type="submit">Send to admin review</Button>
          {notice && <span className="text-sm text-green-700">{notice}</span>}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your postings</h2>
        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
            No jobs submitted yet.
          </p>
        ) : (
          jobs.map((job) => {
            return (
              <article
                key={job.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{job.title}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.location} | {job.employment_type.replace("_", " ")} |{" "}
                    {applicationCount[job.id] || 0} applications
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Posted {new Date(job.created_at).toLocaleString()} |
                    Deadline: {formatDeadlineDate(job.application_deadline)}
                    {job.education_required &&
                      ` | Education: ${job.education_required}`}
                    {job.application_deadline && (
                      <span className="ml-2 font-semibold text-red-600">
                        {formatDeadlineCountdown(job.application_deadline, now)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === "published" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void recruitment
                          .updateJob(job.id, { status: "closed" })
                          .then(refresh);
                      }}
                    >
                      Close posting
                    </Button>
                  )}
                  {job.status === "closed" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void recruitment
                          .updateJob(job.id, {
                            status: "pending_review",
                          })
                          .then(refresh);
                      }}
                    >
                      Send for review again
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
