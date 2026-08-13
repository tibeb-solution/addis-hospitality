"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getEmployeeProfile } from "@/lib/local-storage";
import { Application, Interview, Job, recruitment } from "@/lib/recruitment";

export default function EmployeeJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("");
  const [ratingFor, setRatingFor] = useState<Application | null>(null);

  const refresh = () => {
    const current = getCurrentUser();
    setUser(current);
    setJobs(recruitment.jobs().filter((job) => job.status === "published" && (!job.application_deadline || new Date(job.application_deadline) >= new Date())).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setApplications(recruitment.applications().filter((application) => application.employee_id === current?.id));
    setInterviews(recruitment.interviews().filter((interview) => interview.employee_id === current?.id));
  };
  useEffect(refresh, []);

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob || !user) return;
    try {
      const profile = getEmployeeProfile(user.id);
      const note = String(new FormData(event.currentTarget).get("cover_note") || "");
      recruitment.apply(selectedJob, user.id, profile, note);
      setMessage(`Application sent for ${selectedJob.title}.`);
      setSelectedJob(null);
      refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to apply."); }
  };

  const submitRating = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ratingFor || !user) return;
    const form = new FormData(event.currentTarget);
    const job = jobs.find((item) => item.id === ratingFor.job_id) || recruitment.jobs().find((item) => item.id === ratingFor.job_id);
    try { recruitment.rate({ application_id: ratingFor.id, author_id: user.id, subject_id: job?.company_id || "", score: Number(form.get("score")), review: String(form.get("review") || "") }); setMessage("Thank you for your rating."); setRatingFor(null); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit rating."); }
  };

  return <div className="space-y-8">
    <div><h1 className="text-3xl font-bold">Jobs and applications</h1><p className="mt-1 text-muted-foreground">Find hospitality work, track applications, and respond to interview invitations.</p>{message && <p className="mt-2 text-sm text-primary">{message}</p>}</div>
    {interviews.filter((item) => item.status === "proposed").map((interview) => <section key={interview.id} className="rounded-lg border border-primary bg-primary/5 p-5"><h2 className="font-semibold">Interview invitation</h2><p className="mt-1 text-sm">{new Date(interview.starts_at).toLocaleString()} · {interview.meeting_type.replace("_", " ")} · {interview.location_or_link}</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => { recruitment.respondToInterview(interview.id, "accepted"); setMessage("Interview accepted."); refresh(); }}>Accept</Button><Button size="sm" variant="outline" onClick={() => { recruitment.respondToInterview(interview.id, "declined"); setMessage("Interview declined."); refresh(); }}>Decline</Button></div></section>)}
    <section className="space-y-3"><h2 className="text-xl font-semibold">Available jobs</h2>{jobs.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-muted-foreground">No active jobs match the current date.</p> : jobs.map((job) => { const applied = applications.some((application) => application.job_id === job.id); const score = user ? recruitment.matchScore(job, getEmployeeProfile(user.id)) : 0; return <article key={job.id} className="rounded-lg border border-border bg-card p-5"><div className="flex flex-col gap-3 md:flex-row md:justify-between"><div><h3 className="font-semibold">{job.title}</h3><p className="text-sm text-muted-foreground">{job.company_name} · {job.location} · {job.employment_type.replace("_", " ")}</p><p className="mt-2 text-sm whitespace-pre-wrap">{job.description}</p><p className="mt-3 text-xs text-muted-foreground">Skills: {job.skills.join(", ") || "Not specified"} · Match: {score}%</p></div><Button disabled={applied} onClick={() => setSelectedJob(job)}>{applied ? "Applied" : "Apply"}</Button></div></article>; })}</section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Your applications</h2>{applications.length === 0 ? <p className="text-muted-foreground">You have not applied to a job yet.</p> : applications.map((application) => { const job = recruitment.jobs().find((item) => item.id === application.job_id); const rated = user && recruitment.ratings().some((rating) => rating.application_id === application.id && rating.author_id === user.id); return <article key={application.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">{job?.title || "Job posting"}</h3><p className="text-sm text-muted-foreground capitalize">{application.status} · Match score {application.match_score}%</p></div>{application.status === "hired" && !rated && <Button variant="outline" size="sm" onClick={() => setRatingFor(application)}>Rate employer</Button>}</article>; })}</section>
    {selectedJob && <form onSubmit={apply} className="space-y-3 rounded-lg border border-primary bg-card p-5"><h2 className="font-semibold">Apply for {selectedJob.title}</h2><textarea name="cover_note" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="Optional note to the employer"/><div className="flex gap-2"><Button type="submit">Send application</Button><Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>Cancel</Button></div></form>}
    {ratingFor && <form onSubmit={submitRating} className="space-y-3 rounded-lg border border-primary bg-card p-5"><h2 className="font-semibold">Rate your employer</h2><select name="score" className="w-full rounded-md border border-input bg-background px-3 py-2" defaultValue="5"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select><textarea name="review" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="Optional review"/><div className="flex gap-2"><Button type="submit">Submit rating</Button><Button type="button" variant="outline" onClick={() => setRatingFor(null)}>Cancel</Button></div></form>}
  </div>;
}
