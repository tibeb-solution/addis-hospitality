"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getEmployeeProfile } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Application,
  Interview,
  Job,
  formatDeadlineDate,
  formatDeadlineCountdown,
  isJobExpired,
  recruitment,
} from "@/lib/recruitment";

export default function EmployeeJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("");
  const [ratingFor, setRatingFor] = useState<Application | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [applying, setApplying] = useState(false);

  const refresh = async () => {
    const { data: { user: authUser } } = await createClient().auth.getUser();
    const current = isSupabaseConfigured() ? authUser : getCurrentUser();
    setUser(current);

    const [availableJobs, allApplications, allInterviews, allDrafts, allRatings] = await Promise.all([
      recruitment.jobs(),
      recruitment.applications(),
      recruitment.interviews(),
      current?.id ? recruitment.applicationDrafts(current.id) : Promise.resolve([]),
      recruitment.ratings(),
    ]);
    setJobs(
      availableJobs
        .filter((job) => job.status === "published" && !isJobExpired(job))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );

    setApplications(
      allApplications
        .filter((application) => application.employee_id === current?.id),
    );

    setInterviews(
      allInterviews
        .filter((interview) => interview.employee_id === current?.id),
    );
    setDrafts(allDrafts);
    setRatings(allRatings);
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const openApplication = async (job: Job) => {
    setSelectedJob(job);
    if (user) {
      const draft = await recruitment.getApplicationDraft(job.id, user.id);
      void recruitment.saveApplicationDraft(
        job.id,
        user.id,
        draft?.cover_note || "",
      );
    }
    setMessage("");
  };

  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedJob || !user || applying) return;

    try {
      setApplying(true);
      setMessage("");
      const profile = isSupabaseConfigured()
        ? (await createClient().from("employee_profiles").select("*").eq("id", user.id).maybeSingle()).data
        : getEmployeeProfile(user.id);
      const note = String(
        new FormData(event.currentTarget).get("cover_note") || "",
      );
      await recruitment.apply(selectedJob, user.id, profile, note);
      try {
        await recruitment.deleteApplicationDraft(selectedJob.id, user.id);
      } catch (draftError) {
        console.warn("Application was sent, but draft cleanup failed.", draftError);
      }
      const appliedTitle = selectedJob.title;
      setSelectedJob(null);
      await refresh();
      setMessage(`Applied successfully for ${appliedTitle}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to apply.");
    } finally {
      setApplying(false);
    }
  };

  const submitRating = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ratingFor || !user) return;

    const form = new FormData(event.currentTarget);
    const job = jobs.find((item) => item.id === ratingFor.job_id);

    try {
      await recruitment.rate({
        application_id: ratingFor.id,
        author_id: user.id,
        subject_id: job?.company_id || "",
        score: Number(form.get("score")),
        review: String(form.get("review") || ""),
      });
      setMessage("Thank you for your rating.");
      setRatingFor(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to submit rating.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Jobs and applications</h1>
        <p className="mt-1 text-muted-foreground">
          Find hospitality work, track applications, and respond to interview
          invitations.
        </p>
        {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      </div>

      {interviews.filter((item) => item.status === "proposed").length > 0 && (
        <section className="space-y-4">
          {interviews
            .filter((item) => item.status === "proposed")
            .map((interview) => (
              <div
                key={interview.id}
                className="rounded-xl border border-primary bg-primary/5 p-5"
              >
                <h2 className="font-semibold">Interview invitation</h2>
                <p className="mt-1 text-sm">
                  {new Date(interview.starts_at).toLocaleString()} |{" "}
                  {interview.meeting_type.replace("_", " ")} |{" "}
                  {interview.location_or_link}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      void recruitment.respondToInterview(interview.id, "accepted");
                      setMessage("Interview accepted.");
                      void refresh();
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void recruitment.respondToInterview(interview.id, "declined");
                      setMessage("Interview declined.");
                      void refresh();
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Available jobs</h2>
        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
            No active jobs match the current date.
          </p>
        ) : (
          jobs.map((job) => {
            const applied = applications.some(
              (application) => application.job_id === job.id,
            );
            const score = user
              ? recruitment.matchScore(job, getEmployeeProfile(user.id))
              : 0;

            return (
              <article
                key={job.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.company_name} | {job.location} |{" "}
                      {job.employment_type.replace("_", " ")}
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {job.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Skills: {job.skills.join(", ") || "Not specified"} |
                      Match: {score}% |
                      Education: {job.education_required || "Not specified"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Posted {new Date(job.created_at).toLocaleString()} |
                      Deadline:{" "}
                      {formatDeadlineDate(job.application_deadline)}
                      {job.application_deadline && (
                        <span className="ml-2 font-semibold text-red-600">
                          {formatDeadlineCountdown(
                            job.application_deadline,
                            now,
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    disabled={applied}
                    onClick={() => openApplication(job)}
                  >
                    {applied
                      ? "Applied"
                      : drafts.some((draft) => draft.job_id === job.id && draft.employee_id === user?.id)
                        ? "Continue"
                        : "Apply"}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your applications</h2>
        {applications.length === 0 ? (
          <p className="text-muted-foreground">
            You have not applied to a job yet.
          </p>
        ) : (
          applications.map((application) => {
            const job = jobs.find((item) => item.id === application.job_id);
            const rated =
              user &&
              ratings.some(
                  (rating) =>
                    rating.application_id === application.id &&
                    rating.author_id === user.id,
                );

            return (
              <article
                key={application.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold">
                    {job?.title || "Job posting"}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {application.status.replace("_", " ")} | Match score{" "}
                    {application.match_score}%
                  </p>
                </div>
                {application.status === "hired" && !rated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatingFor(application)}
                  >
                    Rate employer
                  </Button>
                )}
              </article>
            );
          })
        )}
      </section>

      {selectedJob && (
        <form
          onSubmit={apply}
          className="space-y-3 rounded-lg border border-primary bg-card p-5"
        >
          <h2 className="font-semibold">Apply for {selectedJob.title}</h2>
          <textarea
            name="cover_note"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Optional note to the employer"
            defaultValue={
              drafts.find((draft) => draft.job_id === selectedJob.id && draft.employee_id === user?.id)
                ?.cover_note || ""
            }
            onChange={(event) =>
              user &&
              void recruitment.saveApplicationDraft(
                selectedJob.id,
                user.id,
                event.target.value,
              )
            }
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={applying}>
              {applying ? "Sending..." : "Send application"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedJob(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {ratingFor && (
        <form
          onSubmit={submitRating}
          className="space-y-3 rounded-lg border border-primary bg-card p-5"
        >
          <h2 className="font-semibold">Rate your employer</h2>
          <select
            name="score"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            defaultValue="5"
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very poor</option>
          </select>
          <textarea
            name="review"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Optional review"
          />
          <div className="flex gap-2">
            <Button type="submit">Submit rating</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRatingFor(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
