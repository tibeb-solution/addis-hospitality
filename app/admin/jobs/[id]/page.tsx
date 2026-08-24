"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getEmployeeProfiles } from "@/lib/local-storage";
import { Job, recruitment } from "@/lib/recruitment";

export default function AdminJobDetailPage() {
  const params = useParams();
  const jobId = String(params.id || "");
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [minimumAge, setMinimumAge] = useState("");
  const [maximumAge, setMaximumAge] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [jobs, allApplications] = await Promise.all([
        recruitment.jobs(),
        recruitment.applications(),
      ]);
      const currentJob = jobs.find((item) => item.id === jobId) || null;
      const jobApplications = allApplications.filter((item) => item.job_id === jobId);
      setJob(currentJob);
      setApplications(jobApplications);

      const employeeIds = [...new Set(jobApplications.map((item) => item.employee_id))];
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const [{ data: accounts }, { data: profiles }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, phone").eq("role", "employee"),
          supabase.from("employee_profiles").select("*"),
        ]);
        const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
        setEmployees(Object.fromEntries((accounts || []).map((account: any) => [account.id, { ...account, ...(profileMap.get(account.id) || {}) }])));
      } else {
        setEmployees(Object.fromEntries(getEmployeeProfiles().map((profile: any) => [profile.id, profile])));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load job details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [jobId]);

  const candidates = useMemo(() => {
    const applicationMap = new Map(applications.map((application) => [application.employee_id, application]));
    return Object.entries(employees).map(([employeeId, employee]) => ({
      employeeId,
      employee,
      application: applicationMap.get(employeeId),
    }));
  }, [applications, employees]);

  const visibleCandidates = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return candidates.filter(({ employee, application }) => {
      const age = employee.age ?? application?.applicant_age;
      const gender = employee.gender || application?.applicant_gender || "";
      return `${employee.full_name || ""} ${employee.email || ""} ${gender} ${employee.desired_position || ""} ${age ?? ""}`.toLowerCase().includes(query)
        && (!genderFilter || gender === genderFilter)
        && (!minimumAge || (age !== undefined && age >= Number(minimumAge)))
        && (!maximumAge || (age !== undefined && age <= Number(maximumAge)));
    });
  }, [candidates, filter, genderFilter, minimumAge, maximumAge]);

  const visibleIds = visibleCandidates
    .filter(({ application }) => !application?.sent_to_company_at)
    .map(({ employeeId }) => employeeId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const sendSelected = async () => {
    if (!job) return;
    try {
      await recruitment.sendEmployeesToCompany(job, selected, employees);
      setMessage(`${selected.length} applicant${selected.length === 1 ? "" : "s"} forwarded to ${job.company_name}.`);
      setSelected([]);
      await refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to forward applicants.");
    }
  };

  if (loading) return <div>Loading job details...</div>;
  if (!job) return <div className="space-y-4"><p>Job not found.</p><Link href="/admin/jobs" className="text-primary hover:underline">Back to job approvals</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/jobs" className="text-sm text-primary hover:underline">Back to job approvals</Link>
          <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.company_name} | {job.location} | {job.status.replace("_", " ")}</p>
        </div>
        <Button onClick={() => void recruitment.updateJob(job.id, { status: job.status === "published" ? "closed" : "published" }).then(refresh)}>
          {job.status === "published" ? "Close job" : "Approve job"}
        </Button>
      </div>

      {message && <p className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Job specification</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-muted-foreground">Position</dt><dd>{job.title}</dd></div>
          <div><dt className="text-muted-foreground">Company</dt><dd>{job.company_name}</dd></div>
          <div><dt className="text-muted-foreground">Expiry date</dt><dd>{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : "No expiry"}</dd></div>
          <div><dt className="text-muted-foreground">Age range</dt><dd>{job.min_age ?? 18} to {job.max_age ?? 65}</dd></div>
          <div><dt className="text-muted-foreground">Gender preference</dt><dd>{job.gender_preference || "No preference"}</dd></div>
          <div><dt className="text-muted-foreground">Experience</dt><dd>{job.experience_required}+ years</dd></div>
          <div><dt className="text-muted-foreground">Education</dt><dd>{job.education_required || "Not specified"}</dd></div>
          <div><dt className="text-muted-foreground">Languages</dt><dd>{job.languages.join(", ") || "Not specified"}</dd></div>
          <div><dt className="text-muted-foreground">Applications</dt><dd>{applications.length}</dd></div>
        </dl>
        <p className="mt-5 whitespace-pre-wrap text-sm">{job.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">Skills: {job.skills.join(", ") || "Not specified"}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">All registered employees</h2><p className="text-sm text-muted-foreground">Browse and select any employee to forward to the company.</p></div>
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search name, email, or position" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-80" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={minimumAge} onChange={(event) => setMinimumAge(event.target.value)} type="number" min="0" placeholder="Minimum age, e.g. 18" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input value={maximumAge} onChange={(event) => setMaximumAge(event.target.value)} type="number" min="0" placeholder="Maximum age, e.g. 65" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        {visibleCandidates.length > 0 && (
          <label className="mt-4 flex items-center gap-2 border-b border-border pb-3 text-sm font-medium">
            <input type="checkbox" checked={allVisibleSelected} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...visibleIds])] : selected.filter((id) => !visibleIds.includes(id)))} />
            Select all visible employees
          </label>
        )}
        <div className="mt-3 space-y-3">
          {visibleCandidates.map(({ employeeId, employee, application }) => {
            const alreadyForwarded = Boolean(application?.sent_to_company_at);
            return <label key={employeeId} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
              <input type="checkbox" disabled={alreadyForwarded} checked={selected.includes(employeeId)} onChange={(event) => setSelected(event.target.checked ? [...selected, employeeId] : selected.filter((id) => id !== employeeId))} />
              <span className="text-sm"><strong>{employee.full_name || "Employee"}</strong> | {employee.email || "No email"}<br />Age: {employee.age ?? application?.applicant_age ?? "Not provided"} | Gender: {employee.gender || application?.applicant_gender || "Not provided"} | Position: {employee.desired_position || "Not provided"}{alreadyForwarded ? " | Already forwarded" : ""}</span>
            </label>;
          })}
          {visibleCandidates.length === 0 && <p className="py-5 text-sm text-muted-foreground">No employees match this filter.</p>}
        </div>
        <Button className="mt-4" disabled={!selected.length} onClick={() => void sendSelected()}>Forward selected to company ({selected.length})</Button>
      </section>
    </div>
  );
}
