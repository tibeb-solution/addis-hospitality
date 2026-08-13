"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCompanyProfile, getCurrentUser } from "@/lib/local-storage";
import { Job, recruitment } from "@/lib/recruitment";

const fieldClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<any>(null);
  const [notice, setNotice] = useState("");

  const refresh = () => {
    const current = getCurrentUser();
    setUser(current);
    setJobs(recruitment.jobs().filter((job) => job.company_id === current?.id).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };

  useEffect(refresh, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const profile = getCompanyProfile(user.id);
    recruitment.createJob({
      company_id: user.id,
      company_name: profile?.company_name || user.full_name,
      title: String(data.get("title") || ""), description: String(data.get("description") || ""),
      location: String(data.get("location") || ""), employment_type: String(data.get("employment_type") || "full_time"),
      experience_required: Number(data.get("experience_required") || 0),
      skills: String(data.get("skills") || "").split(",").map((value) => value.trim()).filter(Boolean),
      languages: String(data.get("languages") || "").split(",").map((value) => value.trim()).filter(Boolean),
      salary_min: data.get("salary_min") ? Number(data.get("salary_min")) : undefined,
      salary_max: data.get("salary_max") ? Number(data.get("salary_max")) : undefined,
      application_deadline: String(data.get("application_deadline") || "") || undefined,
      status: "published",
    });
    event.currentTarget.reset();
    setNotice("Job published. Employees can now apply.");
    refresh();
  };

  return <div className="space-y-8">
    <div><h1 className="text-3xl font-bold">Jobs</h1><p className="mt-1 text-muted-foreground">Create, publish, close, and track your vacancy postings.</p></div>
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
      <h2 className="md:col-span-2 text-xl font-semibold">Post a job</h2>
      <input required name="title" placeholder="Job title" className={fieldClass} />
      <input required name="location" placeholder="Location (e.g. Addis Ababa)" className={fieldClass} />
      <select name="employment_type" className={fieldClass}><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option></select>
      <input name="experience_required" type="number" min="0" defaultValue="0" placeholder="Required years of experience" className={fieldClass} />
      <input name="skills" placeholder="Skills, separated by commas" className={fieldClass} />
      <input name="languages" placeholder="Languages, separated by commas" className={fieldClass} />
      <input name="salary_min" type="number" min="0" placeholder="Minimum monthly salary (ETB)" className={fieldClass} />
      <input name="salary_max" type="number" min="0" placeholder="Maximum monthly salary (ETB)" className={fieldClass} />
      <input name="application_deadline" type="date" className={fieldClass} />
      <textarea required name="description" placeholder="Describe responsibilities, requirements, and benefits" className={`${fieldClass} min-h-28 md:col-span-2`} />
      <div className="md:col-span-2 flex items-center gap-3"><Button type="submit">Publish job</Button>{notice && <span className="text-sm text-green-700">{notice}</span>}</div>
    </form>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Your postings</h2>{jobs.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-muted-foreground">No jobs posted yet.</p> : jobs.map((job) => <article key={job.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex gap-2"><h3 className="font-semibold">{job.title}</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{job.status}</span></div><p className="text-sm text-muted-foreground">{job.location} · {job.employment_type.replace("_", " ")} · {recruitment.applications().filter((application) => application.job_id === job.id).length} applications</p></div><div className="flex gap-2">{job.status === "published" ? <Button variant="outline" onClick={() => { recruitment.updateJob(job.id, { status: "closed" }); refresh(); }}>Close posting</Button> : <Button variant="outline" onClick={() => { recruitment.updateJob(job.id, { status: "published" }); refresh(); }}>Reopen</Button>}</div></article>)}</section>
  </div>;
}
