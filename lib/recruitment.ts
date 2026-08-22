"use client";

export type JobStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "closed"
  | "expired"
  | "rejected";
export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Job {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  experience_required: number;
  skills: string[];

  languages: string[];
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface Application {
  id: string;
  job_id: string;
  employee_id: string;
  status: ApplicationStatus;
  match_score: number;
  cover_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDraft {
  id: string;
  job_id: string;
  employee_id: string;
  cover_note?: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  company_id: string;
  employee_id: string;
  starts_at: string;
  meeting_type: "in_person" | "phone" | "video";
  location_or_link: string;
  status: "proposed" | "accepted" | "declined" | "cancelled";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read_at?: string;
  created_at: string;
}

export interface Rating {
  id: string;
  application_id: string;
  author_id: string;
  subject_id: string;
  score: number;
  review?: string;
  created_at: string;
}

const keys = {
  jobs: "ah_jobs",
  applications: "ah_applications",
  applicationDrafts: "ah_application_drafts",
  interviews: "ah_interviews",
  notifications: "ah_notifications",
  ratings: "ah_ratings",
};

const ADMIN_USER_ID = "admin-001";

function id() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function remoteRows<T = any>(table: string, configure?: (query: any) => any): Promise<T[]> {
  let query = createClient().from(table).select("*");
  if (configure) query = configure(query);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function deadlineTimestamp(deadline?: string) {
  if (!deadline) return undefined;
  const datePart = deadline.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const timestamp = datePart
    ? new Date(`${datePart}T23:59:59`).getTime()
    : new Date(deadline).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function isJobExpired(job: Job, now = Date.now()) {
  const deadline = deadlineTimestamp(job.application_deadline);
  return deadline !== undefined && deadline < now;
}

export function formatDeadlineCountdown(deadline?: string, now = Date.now()) {
  const timestamp = deadlineTimestamp(deadline);
  if (timestamp === undefined) return "No deadline";
  const remaining = timestamp - now;
  if (remaining <= 0) return "Expired";
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${days}d ${hours}h ${minutes}m left`;
}

export function formatDeadlineDate(deadline?: string) {
  if (!deadline) return "Open";
  const datePart = deadline.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = datePart ? new Date(`${datePart}T12:00:00`) : new Date(deadline);
  return Number.isNaN(date.getTime()) ? "Open" : date.toLocaleDateString();
}

export const recruitment = {
  jobs: async (): Promise<Job[]> => {
    if (isSupabaseConfigured()) {
      const jobs = await remoteRows<any>("jobs", (query) => query.order("created_at", { ascending: false }));
      const ids = [...new Set(jobs.map((job: any) => job.company_id))];
      const profiles = ids.length ? await remoteRows<any>("company_profiles", (query) => query.in("id", ids)) : [];
      const names = new Map(profiles.map((profile: any) => [profile.id, profile.company_name]));
      return jobs.map((job: any) => ({ ...job, company_name: names.get(job.company_id) || "" })) as Job[];
    }
    const jobs = read<Job>(keys.jobs);
    const now = Date.now();
    const expired = jobs.filter(
      (job) => job.status === "published" && isJobExpired(job, now),
    );

    if (!expired.length) return jobs;

    const expiredIds = new Set(expired.map((job) => job.id));
    const updatedJobs = jobs.map((job) =>
      expiredIds.has(job.id)
        ? {
            ...job,
            status: "expired" as const,
            updated_at: new Date(now).toISOString(),
          }
        : job,
    );
    write(keys.jobs, updatedJobs);

    const employees = read<{ id: string; role: string }>("ah_users").filter(
      (user) => user.role === "employee",
    );
    expired.forEach((job) => {
      recruitment.notify(
        job.company_id,
        "Job posting expired",
        `${job.title} reached its application deadline.`,
        "job_expired",
      );
      employees.forEach((employee) =>
        recruitment.notify(
          employee.id,
          "Job posting expired",
          `${job.title} at ${job.company_name} is no longer accepting applications.`,
          "job_expired",
        ),
      );
    });
    return updatedJobs;
  },
  applications: async (): Promise<Application[]> => isSupabaseConfigured() ? remoteRows<Application>("applications", (query) => query.order("created_at", { ascending: false })) : read<Application>(keys.applications),
  applicationDrafts: async (employeeId?: string): Promise<ApplicationDraft[]> => isSupabaseConfigured() ? remoteRows<ApplicationDraft>("application_drafts", (query) => employeeId ? query.eq("employee_id", employeeId) : query) : read<ApplicationDraft>(keys.applicationDrafts),
  interviews: async (): Promise<Interview[]> => isSupabaseConfigured() ? remoteRows<Interview>("interviews", (query) => query.order("starts_at", { ascending: true })) : read<Interview>(keys.interviews),
  notifications: async (userId: string): Promise<Notification[]> => isSupabaseConfigured() ? remoteRows<Notification>("notifications", (query) => query.eq("user_id", userId).order("created_at", { ascending: false })) :
    read<Notification>(keys.notifications)
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  ratings: async (): Promise<Rating[]> => isSupabaseConfigured() ? remoteRows<Rating>("ratings", (query) => query.order("created_at", { ascending: false })) : read<Rating>(keys.ratings),
  async createJob(input: Omit<Job, "id" | "created_at" | "updated_at">) {
    if (isSupabaseConfigured()) {
      const { company_name: _companyName, ...payload } = input;
      const { data, error } = await createClient().from("jobs").insert(payload).select().single();
      if (error) throw error;
      return { ...data, company_name: input.company_name } as Job;
    }
    const now = new Date().toISOString();
    const job = { ...input, id: id(), created_at: now, updated_at: now };
    write(keys.jobs, [...await this.jobs(), job]);
    if (job.status === "pending_review") {
      this.notify(
        ADMIN_USER_ID,
        "Job pending approval",
        `${job.company_name} submitted ${job.title} for review.`,
        "job_review",
      );
    }
    return job;
  },
  async saveApplicationDraft(jobId: string, employeeId: string, coverNote: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await createClient().from("application_drafts").upsert({ job_id: jobId, employee_id: employeeId, cover_note: coverNote }, { onConflict: "job_id,employee_id" }).select().single();
      if (error) throw error;
      return data as ApplicationDraft;
    }
    const drafts = await this.applicationDrafts();
    const existing = drafts.find(
      (draft) => draft.job_id === jobId && draft.employee_id === employeeId,
    );
    const draft: ApplicationDraft = {
      id: existing?.id || id(),
      job_id: jobId,
      employee_id: employeeId,
      cover_note: coverNote,
      updated_at: new Date().toISOString(),
    };
    write(
      keys.applicationDrafts,
      existing
        ? drafts.map((item) => (item.id === existing.id ? draft : item))
        : [...drafts, draft],
    );
    return draft;
  },
  async getApplicationDraft(jobId: string, employeeId: string) {
    return (await this.applicationDrafts(employeeId)).find(
      (draft) => draft.job_id === jobId && draft.employee_id === employeeId,
    );
  },
  async deleteApplicationDraft(jobId: string, employeeId: string) {
    if (isSupabaseConfigured()) {
      const { error } = await createClient().from("application_drafts").delete().eq("job_id", jobId).eq("employee_id", employeeId);
      if (error) throw error;
      return;
    }
    write(
      keys.applicationDrafts,
      (await this.applicationDrafts()).filter(
        (draft) =>
          !(draft.job_id === jobId && draft.employee_id === employeeId),
      ),
    );
  },
  async updateJob(jobId: string, updates: Partial<Job>) {
    if (isSupabaseConfigured()) {
      const { company_name: _companyName, id: _id, created_at: _createdAt, updated_at: _updatedAt, ...payload } = updates as any;
      const { error } = await createClient().from("jobs").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", jobId);
      if (error) throw error;
      return;
    }
    const before = (await this.jobs()).find((job) => job.id === jobId);
    const updatedAt = new Date().toISOString();
    write(
      keys.jobs,
      (await this.jobs()).map((job) =>
        job.id === jobId ? { ...job, ...updates, updated_at: updatedAt } : job,
      ),
    );

    if (before && updates.status && updates.status !== before.status) {
      const statusMessages: Partial<Record<JobStatus, string>> = {
        pending_review: "Your job posting was sent to admin review.",
        published:
          "Your job posting was approved and is now visible to employees.",
        rejected: "Your job posting was rejected by the admin.",
        closed: "Your job posting was closed.",
      };
      this.notify(
        before.company_id,
        "Job status updated",
        `${before.title}: ${statusMessages[updates.status] ?? `Status changed to ${updates.status}.`}`,
        "job",
      );
    }
  },
  async apply(job: Job, employeeId: string, profile: any, coverNote?: string) {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user || user.id !== employeeId) {
        throw new Error("Please log in as the employee before applying.");
      }
    }
    if (job.status !== "published") {
      throw new Error("This job is not open for applications yet.");
    }
    if (job.application_deadline && isJobExpired(job)) {
      throw new Error("The application deadline for this job has passed.");
    }
    if (
      (await this.applications()).some(
        (item) => item.job_id === job.id && item.employee_id === employeeId,
      )
    ) {
      throw new Error("You have already applied for this job.");
    }
    if (isSupabaseConfigured()) {
      const { data, error } = await createClient().from("applications").insert({ job_id: job.id, employee_id: employeeId, status: "applied", match_score: this.matchScore(job, profile), cover_note: coverNote }).select().single();
      if (error) {
        if ((error as any).code === "23505") {
          throw new Error("You have already applied for this job.");
        }
        if ((error as any).code === "23503") {
          throw new Error("Your employee account is not fully connected to the database yet. Please sign out and sign in again, then try applying.");
        }
        if ((error as any).code === "42501") {
          throw new Error("Applications are blocked by database permissions. Run the latest Supabase policies from supabase-init.sql, then try again.");
        }
        throw error;
      }
      return data as Application;
    }
    const now = new Date().toISOString();
    const application: Application = {
      id: id(),
      job_id: job.id,
      employee_id: employeeId,
      status: "applied",
      match_score: this.matchScore(job, profile),
      cover_note: coverNote,
      created_at: now,
      updated_at: now,
    };
    write(keys.applications, [...await this.applications(), application]);
    this.notify(
      job.company_id,
      "New application",
      `A candidate applied for ${job.title}.`,
      "application",
    );
    this.notify(
      ADMIN_USER_ID,
      "New application",
      `A candidate applied for ${job.title}.`,
      "application",
    );
    return application;
  },
  async updateApplication(applicationId: string, status: ApplicationStatus) {
    if (isSupabaseConfigured()) {
      const { error } = await createClient().from("applications").update({ status, updated_at: new Date().toISOString() }).eq("id", applicationId);
      if (error) throw error;
      return;
    }
    const application = (await this.applications()).find(
      (item) => item.id === applicationId,
    );
    if (!application) return;
    write(
      keys.applications,
      (await this.applications()).map((item) =>
        item.id === applicationId
          ? { ...item, status, updated_at: new Date().toISOString() }
          : item,
      ),
    );
    const job = (await this.jobs()).find((item) => item.id === application.job_id);
    this.notify(
      application.employee_id,
      "Application update",
      `Your application for ${job?.title ?? "a job"} is now ${status}.`,
      "application",
    );
    this.notify(
      ADMIN_USER_ID,
      "Application update",
      `${job?.title ?? "A job application"} is now ${status}.`,
      "application",
    );
  },
  async scheduleInterview(input: Omit<Interview, "id" | "created_at" | "status">) {
    if (isSupabaseConfigured()) {
      const { data, error } = await createClient().from("interviews").insert(input).select().single();
      if (error) throw error;
      await this.updateApplication(input.application_id, "interview");
      return data as Interview;
    }
    const interview = {
      ...input,
      id: id(),
      status: "proposed" as const,
      created_at: new Date().toISOString(),
    };
    write(keys.interviews, [...await this.interviews(), interview]);
    await this.updateApplication(input.application_id, "interview");
    const application = (await this.applications()).find(
      (item) => item.id === input.application_id,
    );
    const job = (await this.jobs()).find((item) => item.id === application?.job_id);
    this.notify(
      input.employee_id,
      "Interview invitation",
      `You have a proposed ${input.meeting_type.replace("_", " ")} interview.`,
      "interview",
    );
    this.notify(
      ADMIN_USER_ID,
      "Interview scheduled",
      `An interview was scheduled for ${job?.title ?? "a job application"}.`,
      "interview",
    );
    return interview;
  },
  async respondToInterview(interviewId: string, status: "accepted" | "declined") {
    if (isSupabaseConfigured()) {
      const { error } = await createClient().from("interviews").update({ status }).eq("id", interviewId);
      if (error) throw error;
      return;
    }
    write(
      keys.interviews,
      (await this.interviews()).map((item) =>
        item.id === interviewId ? { ...item, status } : item,
      ),
    );
  },
  notify(userId: string, title: string, body: string, type: string) {
    const note: Notification = {
      id: id(),
      user_id: userId,
      title,
      body,
      type,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured()) {
      return createClient().from("notifications").insert({ user_id: userId, title, body, type });
    }
    write(keys.notifications, [
      ...read<Notification>(keys.notifications),
      note,
    ]);
  },
  async markRead(notificationId: string) {
    if (isSupabaseConfigured()) {
      const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
      if (error) throw error;
      return;
    }
    write(
      keys.notifications,
      read<Notification>(keys.notifications).map((item) =>
        item.id === notificationId
          ? { ...item, read_at: new Date().toISOString() }
          : item,
      ),
    );
  },
  async rate(input: Omit<Rating, "id" | "created_at">) {
    if (isSupabaseConfigured()) {
      const { data, error } = await createClient().from("ratings").insert(input).select().single();
      if (error) throw error;
      return data as Rating;
    }
    if (
      (await this.ratings()).some(
        (rating) =>
          rating.application_id === input.application_id &&
          rating.author_id === input.author_id,
      )
    ) {
      throw new Error(
        "You have already submitted a rating for this employment.",
      );
    }
    const rating = { ...input, id: id(), created_at: new Date().toISOString() };
    write(keys.ratings, [...await this.ratings(), rating]);
    return rating;
  },
  matchScore(job: Job, profile: any) {
    let score = 0;
    const normalize = (values: unknown) =>
      Array.isArray(values)
        ? values.map((value) => String(value).toLowerCase())
        : String(values || "")
            .toLowerCase()
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
    const profileSkills = normalize(profile?.skills);
    const jobSkills = normalize(job.skills);
    const matchedSkills = jobSkills.filter((skill) =>
      profileSkills.includes(skill),
    ).length;
    if (jobSkills.length)
      score += Math.round((matchedSkills / jobSkills.length) * 45);
    if (Number(profile?.years_experience || 0) >= job.experience_required)
      score += 25;
    if (
      String(profile?.preferred_cities || "")
        .toLowerCase()
        .includes(job.location.toLowerCase()) ||
      profile?.willing_to_relocate
    )
      score += 15;
    const profileLanguages = normalize(profile?.languages);
    const jobLanguages = normalize(job.languages);
    if (
      !jobLanguages.length ||
      jobLanguages.some((language) => profileLanguages.includes(language))
    )
      score += 15;
    return Math.min(score, 100);
  },
};
