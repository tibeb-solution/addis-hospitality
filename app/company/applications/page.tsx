"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Application, Job, recruitment } from "@/lib/recruitment";

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<any>(null);
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null);
  const [when, setWhen] = useState("");
  const [meetingType, setMeetingType] = useState("in_person");
  const [place, setPlace] = useState("");
  const [message, setMessage] = useState("");
  const [employees, setEmployees] = useState<Record<string, any>>({});

  const refresh = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const current = isSupabaseConfigured() ? authUser : getCurrentUser();
    setUser(current);

    if (!current) {
      setJobs([]);
      setApplications([]);
      return;
    }

    const ownJobs = (await recruitment.jobs())
      .filter((job) => job.company_id === current.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setJobs(ownJobs);
    const companyApplications = (await recruitment.applications())
      .filter((application) =>
        ownJobs.some((job) => job.id === application.job_id),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const employeeIds = [...new Set(companyApplications.map((application) => application.employee_id))];
    const { data: employeeProfiles } = employeeIds.length && isSupabaseConfigured()
      ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", employeeIds)
      : { data: [] };
    setEmployees(Object.fromEntries((employeeProfiles || []).map((employee: any) => [employee.id, employee])));
    setApplications(companyApplications);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const update = async (application: Application, status: Application["status"]) => {
    await recruitment.updateApplication(application.id, status);
    setMessage(`Application marked as ${status.replace("_", " ")}.`);
    await refresh();
  };

  const schedule = async () => {
    if (!scheduleFor || !user) return;
    if (!when || !place) {
      setMessage("Choose an interview date, time, and location or link.");
      return;
    }

    await recruitment.scheduleInterview({
      application_id: scheduleFor.id,
      company_id: user.id,
      employee_id: scheduleFor.employee_id,
      starts_at: new Date(when).toISOString(),
      meeting_type: meetingType as any,
      location_or_link: place,
    });

    setScheduleFor(null);
    setWhen("");
    setPlace("");
    setMessage("Interview invitation sent.");
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="mt-1 text-muted-foreground">
          Review candidates and move them through a controlled hiring pipeline.
        </p>
        {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      </div>

      {applications.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
          Applications will appear here once candidates apply.
        </p>
      ) : (
        applications.map((application) => {
          const job = jobs.find((item) => item.id === application.job_id);
          const employee = employees[application.employee_id];

          return (
            <article
              key={application.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {(employee?.full_name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {employee?.full_name || "Candidate"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {job?.title || "Job application"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Match score: {application.match_score}% | Status:{" "}
                    <span className="capitalize text-foreground">
                      {application.status.replace("_", " ")}
                    </span>
                  </p>

                  {application.cover_note && (
                    <p className="max-w-2xl text-sm text-foreground/80">
                      {application.cover_note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(application, "shortlisted")}
                  >
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      application.status === "rejected" ||
                      application.status === "hired"
                    }
                    onClick={() => setScheduleFor(application)}
                  >
                    Interview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(application, "hired")}
                  >
                    Hire
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update(application, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </article>
          );
        })
      )}

      {scheduleFor && (
        <div className="rounded-xl border border-primary bg-card p-5 space-y-3">
          <h2 className="font-semibold">Schedule interview</h2>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
          />
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value)}
          >
            <option value="in_person">In person</option>
            <option value="phone">Phone</option>
            <option value="video">Video</option>
          </select>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Address, phone number, or video link"
            value={place}
            onChange={(event) => setPlace(event.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={schedule}>Send invitation</Button>
            <Button variant="outline" onClick={() => setScheduleFor(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
