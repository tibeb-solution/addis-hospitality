"use client";

export type JobStatus = "draft" | "published" | "closed" | "expired";
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
  interviews: "ah_interviews",
  notifications: "ah_notifications",
  ratings: "ah_ratings",
};

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

export const recruitment = {
  jobs: () => read<Job>(keys.jobs),
  applications: () => read<Application>(keys.applications),
  interviews: () => read<Interview>(keys.interviews),
  notifications: (userId: string) =>
    read<Notification>(keys.notifications)
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  ratings: () => read<Rating>(keys.ratings),
  createJob(input: Omit<Job, "id" | "created_at" | "updated_at">) {
    const now = new Date().toISOString();
    const job = { ...input, id: id(), created_at: now, updated_at: now };
    write(keys.jobs, [...this.jobs(), job]);
    return job;
  },
  updateJob(jobId: string, updates: Partial<Job>) {
    write(keys.jobs, this.jobs().map((job) =>
      job.id === jobId ? { ...job, ...updates, updated_at: new Date().toISOString() } : job,
    ));
  },
  apply(job: Job, employeeId: string, profile: any, coverNote?: string) {
    if (this.applications().some((item) => item.job_id === job.id && item.employee_id === employeeId)) {
      throw new Error("You have already applied for this job.");
    }
    const now = new Date().toISOString();
    const application: Application = {
      id: id(), job_id: job.id, employee_id: employeeId, status: "applied",
      match_score: this.matchScore(job, profile), cover_note: coverNote,
      created_at: now, updated_at: now,
    };
    write(keys.applications, [...this.applications(), application]);
    this.notify(job.company_id, "New application", `A candidate applied for ${job.title}.`, "application");
    return application;
  },
  updateApplication(applicationId: string, status: ApplicationStatus) {
    const application = this.applications().find((item) => item.id === applicationId);
    if (!application) return;
    write(keys.applications, this.applications().map((item) =>
      item.id === applicationId ? { ...item, status, updated_at: new Date().toISOString() } : item,
    ));
    const job = this.jobs().find((item) => item.id === application.job_id);
    this.notify(application.employee_id, "Application update", `Your application for ${job?.title ?? "a job"} is now ${status}.`, "application");
  },
  scheduleInterview(input: Omit<Interview, "id" | "created_at" | "status">) {
    const interview = { ...input, id: id(), status: "proposed" as const, created_at: new Date().toISOString() };
    write(keys.interviews, [...this.interviews(), interview]);
    this.updateApplication(input.application_id, "interview");
    this.notify(input.employee_id, "Interview invitation", `You have a proposed ${input.meeting_type.replace("_", " ")} interview.`, "interview");
    return interview;
  },
  respondToInterview(interviewId: string, status: "accepted" | "declined") {
    write(keys.interviews, this.interviews().map((item) => item.id === interviewId ? { ...item, status } : item));
  },
  notify(userId: string, title: string, body: string, type: string) {
    const note: Notification = { id: id(), user_id: userId, title, body, type, created_at: new Date().toISOString() };
    write(keys.notifications, [...read<Notification>(keys.notifications), note]);
  },
  markRead(notificationId: string) {
    write(keys.notifications, read<Notification>(keys.notifications).map((item) =>
      item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item,
    ));
  },
  rate(input: Omit<Rating, "id" | "created_at">) {
    if (this.ratings().some((rating) => rating.application_id === input.application_id && rating.author_id === input.author_id)) {
      throw new Error("You have already submitted a rating for this employment.");
    }
    const rating = { ...input, id: id(), created_at: new Date().toISOString() };
    write(keys.ratings, [...this.ratings(), rating]);
    return rating;
  },
  matchScore(job: Job, profile: any) {
    let score = 0;
    const normalize = (values: unknown) => Array.isArray(values) ? values.map((value) => String(value).toLowerCase()) : String(values || "").toLowerCase().split(",").map((value) => value.trim()).filter(Boolean);
    const profileSkills = normalize(profile?.skills);
    const jobSkills = normalize(job.skills);
    const matchedSkills = jobSkills.filter((skill) => profileSkills.includes(skill)).length;
    if (jobSkills.length) score += Math.round((matchedSkills / jobSkills.length) * 45);
    if (Number(profile?.years_experience || 0) >= job.experience_required) score += 25;
    if (String(profile?.preferred_cities || "").toLowerCase().includes(job.location.toLowerCase()) || profile?.willing_to_relocate) score += 15;
    const profileLanguages = normalize(profile?.languages);
    const jobLanguages = normalize(job.languages);
    if (!jobLanguages.length || jobLanguages.some((language) => profileLanguages.includes(language))) score += 15;
    return Math.min(score, 100);
  },
};
