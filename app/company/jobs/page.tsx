"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCompanyProfile, getCurrentUser } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Job, formatDeadlineDate, formatDeadlineCountdown, recruitment } from "@/lib/recruitment";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function statusLabel(status: Job["status"]) {
  return status.replace("_", " ");
}

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCount, setApplicationCount] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const refresh = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const current = isSupabaseConfigured() ? session?.user : getCurrentUser();
    setUser(current);
    const [companyJobs, applications] = await Promise.all([
      recruitment.jobs(),
      recruitment.applications(),
    ]);
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
      ? (await createClient().from("company_profiles").select("company_name").eq("id", user.id).maybeSingle()).data
      : getCompanyProfile(user.id);

    try {
      await recruitment.createJob({
      company_id: user.id,
      company_name: profile?.company_name || user.full_name,
      title: String(data.get("title") || ""),
      description: String(data.get("description") || ""),
      location: String(data.get("location") || ""),
      employment_type: String(data.get("employment_type") || "full_time"),
      experience_required: Number(data.get("experience_required") || 0),
      skills: String(data.get("skills") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      languages: String(data.get("languages") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
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
      setNotice(error instanceof Error ? error.message : "Unable to submit job.");
      return;
    }

    form.reset();
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
        <input
          required
          name="title"
          placeholder="Job title"
          className={fieldClass}
        />
        <input
          required
          name="location"
          placeholder="Location (e.g. Addis Ababa)"
          className={fieldClass}
        />
        <select name="employment_type" className={fieldClass}>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contract">Contract</option>
        </select>
        <input
          name="experience_required"
          type="number"
          min="0"
          defaultValue="0"
          placeholder="Required years of experience"
          className={fieldClass}
        />
        <input
          name="skills"
          placeholder="Skills, separated by commas"
          className={fieldClass}
        />
        <input
          name="languages"
          placeholder="Languages, separated by commas"
          className={fieldClass}
        />
        <input
          name="salary_min"
          type="number"
          min="0"
          placeholder="Minimum monthly salary (ETB)"
          className={fieldClass}
        />
        <input
          name="salary_max"
          type="number"
          min="0"
          placeholder="Maximum monthly salary (ETB)"
          className={fieldClass}
        />
        <input name="application_deadline" type="date" className={fieldClass} />
        <textarea
          required
          name="description"
          placeholder="Describe responsibilities, requirements, and benefits"
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
                    Deadline:{" "}
                    {formatDeadlineDate(job.application_deadline)}
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
                        void recruitment.updateJob(job.id, { status: "closed" }).then(refresh);
                      }}
                    >
                      Close posting
                    </Button>
                  )}
                  {job.status === "closed" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void recruitment.updateJob(job.id, {
                          status: "pending_review",
                        }).then(refresh);
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
