"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Job, recruitment } from "@/lib/recruitment";

const statusClass: Record<Job["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-yellow-500/10 text-yellow-700",
  published: "bg-green-500/10 text-green-700",
  closed: "bg-slate-500/10 text-slate-700",
  expired: "bg-orange-500/10 text-orange-700",
  rejected: "bg-red-500/10 text-red-700",
};

function formatStatus(status: Job["status"] | "all") {
  return status.replace("_", " ");
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Job["status"] | "all">(
    "pending_review",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const [loadedJobs, applications] = await Promise.all([
        recruitment.jobs(),
        recruitment.applications(),
      ]);
      setJobs(loadedJobs.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      setApplicationCounts(
        applications.reduce<Record<string, number>>((counts, application) => {
          counts[application.job_id] = (counts[application.job_id] || 0) + 1;
          return counts;
        }, {}),
      );
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load jobs.");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visibleJobs = useMemo(
    () => jobs.filter((job) => filter === "all" || job.status === filter),
    [filter, jobs],
  );

  const counts = useMemo(
    () =>
      jobs.reduce(
        (acc, job) => {
          acc[job.status] += 1;
          acc.all += 1;
          return acc;
        },
        {
          all: 0,
          draft: 0,
          pending_review: 0,
          published: 0,
          closed: 0,
          expired: 0,
          rejected: 0,
        } as Record<Job["status"] | "all", number>,
      ),
    [jobs],
  );

  const updateStatus = async (job: Job, status: Job["status"]) => {
    await recruitment.updateJob(job.id, { status });
    setMessage(`${job.title} is now ${formatStatus(status)}.`);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review company job posts before employees can discover and apply to
          them.
        </p>
        {message && <p className="mt-2 text-sm text-primary">{message}</p>}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "pending_review",
            "published",
            "rejected",
            "closed",
            "all",
          ] as const
        ).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {formatStatus(status)} ({counts[status]})
          </Button>
        ))}
      </div>

      {visibleJobs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
          No jobs in this queue.
        </p>
      ) : (
        <section className="space-y-4">
          {visibleJobs.map((job) => {
            return (
              <article
                key={job.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{job.title}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusClass[job.status]}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.company_name} |{" "}
                        {job.location} | {job.employment_type.replace("_", " ")}
                      </p>
                    </div>

                    <p className="max-w-3xl whitespace-pre-wrap text-sm">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Experience: {job.experience_required}+ years</span>
                      <span>Skills: {job.skills.join(", ") || "Not specified"}</span>
                      <span>
                        Languages: {job.languages.join(", ") || "Not specified"}
                      </span>
                      <span>Applications: {applicationCounts[job.id] || 0}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.status !== "published" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(job, "published")}
                      >
                        Approve
                      </Button>
                    )}
                    {job.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                    {job.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job, "closed")}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
