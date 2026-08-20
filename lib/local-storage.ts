"use client";

export interface LocalUser {
  id: string;
  email: string;
  password: string;
  role: "employee" | "company" | "admin";
  full_name: string;
  phone: string;
  status: "active" | "pending" | "suspended" | "rejected";
  email_verified?: boolean;
  created_at: string;
}

export interface EmployeeProfile extends LocalUser {
  avatar_path?: string;
  avatar_url?: string | null;
  avatar_status?: "pending" | "approved" | "rejected" | null;
  desired_position?: string;
  years_experience?: number;
  preferred_cities?: string;
  expected_salary_min?: number;
  expected_salary_max?: number;
  skills?: string[];
  bio?: string;
  status_note?: string;
}

export interface CompanyProfile extends LocalUser {
  company_name?: string;
  logo_path?: string;
  logo_url?: string | null;
  logo_status?: "pending" | "approved" | "rejected" | null;
  trade_license_number?: string;
  tin_number?: string;
  year_established?: number;
  employee_count?: number;
  website?: string;
  contact_person?: string;
  contact_position?: string;
  contact_phone?: string;
  contact_email?: string;
  region?: string;
  sub_city?: string;
  address?: string;
  is_verified?: boolean;
  review_note?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  business_type?: string;
  description?: string;
}

export interface Document {
  id: string;
  user_id: string;
  kind: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: "pending" | "verified" | "rejected";
  data: string; // base64
  created_at: string;
  reviewed_at?: string;
  review_note?: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  employment_type: "full-time" | "part-time" | "contract" | "temporary";
  requirements: string[];
  posted_date: string;
  status: "open" | "closed";
}

export interface JobApplication {
  id: string;
  job_id: string;
  employee_id: string;
  applied_date: string;
  status:
    | "applied"
    | "rejected"
    | "interview_scheduled"
    | "hired"
    | "withdrawn";
  cover_letter?: string;
  interview_date?: string;
  interview_notes?: string;
  rejection_reason?: string;
}

const STORAGE_KEYS = {
  USERS: "ah_users",
  CURRENT_USER: "ah_current_user",
  EMPLOYEE_PROFILES: "ah_employee_profiles",
  COMPANY_PROFILES: "ah_company_profiles",
  DOCUMENTS: "ah_documents",
  AUDIT_LOG: "ah_audit_log",
  JOBS: "ah_jobs",
  JOB_APPLICATIONS: "ah_job_applications",
};

// Users
export function getUsers(): LocalUser[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function createUser(
  email: string,
  password: string,
  role: "employee" | "company",
  data: any,
): LocalUser {
  const users = getUsers();
  const registeredAt = new Date().toISOString();
  const normalizedEmail = normalizeEmail(email);
  const newUser: LocalUser = {
    id: Math.random().toString(36).substr(2, 9),
    email: normalizedEmail,
    password, // In production, hash this!
    role,
    full_name: data.full_name || data.company_name || "",
    phone: data.phone || "",
    status: "pending",
    email_verified: false,
    created_at: registeredAt,
  };
  users.push(newUser);
  saveUsers(users);

  // Create the role profile at registration so it is immediately visible to admins.
  if (role === "employee") {
    const profiles = getEmployeeProfiles();
    profiles.push({ ...newUser, created_at: registeredAt } as EmployeeProfile);
    saveEmployeeProfiles(profiles);
  } else {
    const profiles = getCompanyProfiles();
    profiles.push({
      ...newUser,
      company_name: data.company_name || "",
      business_type: data.business_type || "",
      city: data.city || "",
      created_at: registeredAt,
    } as CompanyProfile);
    saveCompanyProfiles(profiles);
  }

  return newUser;
}

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function findUserByEmail(email: string): LocalUser | undefined {
  const normalized = normalizeEmail(email);
  return getUsers().find((u) => normalizeEmail(u.email) === normalized);
}

export function resetLegacyUserForVerification(
  email: string,
  password: string,
  role: "employee" | "company",
  data: any,
): LocalUser {
  const users = getUsers();
  const index = users.findIndex(
    (u) => normalizeEmail(u.email) === normalizeEmail(email),
  );

  if (index === -1) {
    return createUser(email, password, role, data);
  }

  const existingUser = users[index];
  const updatedUser: LocalUser = {
    ...existingUser,
    email: normalizeEmail(email),
    password,
    role,
    full_name:
      data.full_name || data.company_name || existingUser.full_name || "",
    phone: data.phone || existingUser.phone || "",
    status: "pending",
    email_verified: false,
  };

  users[index] = updatedUser;
  saveUsers(users);

  if (role === "employee") {
    const profiles = getEmployeeProfiles();
    const existingProfileIndex = profiles.findIndex(
      (p) => p.id === existingUser.id,
    );
    if (existingProfileIndex >= 0) {
      profiles[existingProfileIndex] = {
        ...profiles[existingProfileIndex],
        ...updatedUser,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
      } as EmployeeProfile;
    }
    saveEmployeeProfiles(profiles);
  } else {
    const profiles = getCompanyProfiles();
    const existingProfileIndex = profiles.findIndex(
      (p) => p.id === existingUser.id,
    );
    if (existingProfileIndex >= 0) {
      profiles[existingProfileIndex] = {
        ...profiles[existingProfileIndex],
        ...updatedUser,
        company_name:
          data.company_name ||
          profiles[existingProfileIndex].company_name ||
          "",
        business_type:
          data.business_type ||
          profiles[existingProfileIndex].business_type ||
          "",
      } as CompanyProfile;
    }
    saveCompanyProfiles(profiles);
  }

  return updatedUser;
}

export function findUserById(id: string): LocalUser | undefined {
  return getUsers().find((u) => u.id === id);
}

// Current session
export function getCurrentUser(): LocalUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;

    const user = JSON.parse(data);

    if (!user || !user.id || !user.email || !user.role) {
      clearCurrentUser();
      return null;
    }

    const existingUser =
      findUserByEmail(user.email) ?? getUsers().find((u) => u.id === user.id);

    if (!existingUser) {
      clearCurrentUser();
      return null;
    }

    // Keep the authenticated session valid even if the stored email casing changes.
    const refreshedUser = {
      ...existingUser,
      ...user,
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    };

    setCurrentUser(refreshedUser);
    return refreshedUser;
  } catch (error) {
    clearCurrentUser();
    return null;
  }
}

export function setCurrentUser(user: LocalUser | null): void {
  if (user) {
    const normalizedUser = {
      ...user,
      email: normalizeEmail(String(user.email || "")),
    };
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(normalizedUser),
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Employee profiles
export function getEmployeeProfiles(): EmployeeProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_PROFILES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEmployeeProfiles(profiles: EmployeeProfile[]): void {
  localStorage.setItem(
    STORAGE_KEYS.EMPLOYEE_PROFILES,
    JSON.stringify(profiles),
  );
}

export function getEmployeeProfile(
  userId: string,
): EmployeeProfile | undefined {
  return getEmployeeProfiles().find((p) => p.id === userId);
}

export function updateEmployeeProfile(
  userId: string,
  updates: Partial<EmployeeProfile>,
): void {
  const profiles = getEmployeeProfiles();
  const index = profiles.findIndex((p) => p.id === userId);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...updates };
  } else {
    const user = getUsers().find((candidate) => candidate.id === userId);
    if (!user) return;
    profiles.push({ ...user, ...updates } as EmployeeProfile);
  }
  saveEmployeeProfiles(profiles);
}

// Company profiles
export function getCompanyProfiles(): CompanyProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY_PROFILES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCompanyProfiles(profiles: CompanyProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.COMPANY_PROFILES, JSON.stringify(profiles));
}

export function getCompanyProfile(userId: string): CompanyProfile | undefined {
  return getCompanyProfiles().find((p) => p.id === userId);
}

export function updateCompanyProfile(
  userId: string,
  updates: Partial<CompanyProfile>,
): void {
  const profiles = getCompanyProfiles();
  const index = profiles.findIndex((p) => p.id === userId);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...updates };
    saveCompanyProfiles(profiles);
  }
}

// Documents
export function getDocuments(userId?: string): Document[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const docs: Document[] = data ? JSON.parse(data) : [];
    return userId ? docs.filter((d) => d.user_id === userId) : docs;
  } catch {
    return [];
  }
}

export function saveDocuments(documents: Document[]): void {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
}

export function uploadDocument(
  userId: string,
  kind: string,
  fileName: string,
  mimeType: string,
  base64Data: string,
): Document {
  const doc: Document = {
    id: Math.random().toString(36).substr(2, 9),
    user_id: userId,
    kind,
    file_name: fileName,
    mime_type: mimeType,
    size_bytes: Math.ceil((base64Data.length * 3) / 4),
    status: "pending",
    data: base64Data,
    created_at: new Date().toISOString(),
  };
  const docs = getDocuments();
  docs.push(doc);
  saveDocuments(docs);
  return doc;
}

export function deleteDocument(documentId: string): void {
  const docs = getDocuments().filter((d) => d.id !== documentId);
  saveDocuments(docs);
}

export function getDocument(documentId: string): Document | undefined {
  return getDocuments().find((d) => d.id === documentId);
}

export function updateDocumentStatus(
  documentId: string,
  status: "verified" | "rejected",
  note?: string,
): void {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === documentId);
  if (doc) {
    doc.status = status;
    doc.reviewed_at = new Date().toISOString();
    if (note) doc.review_note = note;
    saveDocuments(docs);
  }
}

// Audit log
export function getAuditLog() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function logAction(
  adminId: string,
  action: string,
  targetUserId: string,
  details: any,
): void {
  const log = getAuditLog();
  log.push({
    id: Math.random().toString(36).substr(2, 9),
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(log));
}

// Helpers
export function updateUserStatus(userId: string, status: string): void {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.status = status as any;
    if (status === "active") {
      user.email_verified = true;
    }
    saveUsers(users);
  }
}

export function isUserApprovedForRole(user: LocalUser | null): boolean {
  if (!user) return false;
  if (user.email_verified === false) return false;
  if (user.status !== "active") return false;
  return true;
}

export function updateUserPasswordByEmail(
  email: string,
  newPassword: string,
): boolean {
  const users = getUsers();
  const index = users.findIndex(
    (u) => normalizeEmail(u.email) === normalizeEmail(email),
  );
  if (index === -1) return false;

  users[index].password = newPassword;
  saveUsers(users);
  clearPasswordResetCode(email);
  return true;
}

export function setUserEmailVerified(
  email: string,
  verified: boolean,
): boolean {
  const users = getUsers();
  const index = users.findIndex(
    (u) => normalizeEmail(u.email) === normalizeEmail(email),
  );

  if (index === -1) return false;

  users[index].email_verified = verified;
  saveUsers(users);
  clearEmailVerificationCode(email);
  return true;
}

export function generateEmailVerificationCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const payload = {
    code,
    expires_at: Date.now() + 10 * 60 * 1000,
  };

  const key = "ah_email_verification_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    typeof payload
  >;
  all[normalizeEmail(email)] = payload;
  localStorage.setItem(key, JSON.stringify(all));
  localStorage.setItem("ah_pending_verification_email", normalizeEmail(email));
  localStorage.setItem("ah_pending_verification_code", code);
  return code;
}

export function verifyEmailVerificationCode(
  email: string,
  code: string,
): boolean {
  const key = "ah_email_verification_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    { code: string; expires_at: number }
  >;
  const normalizedEmail = normalizeEmail(email);
  const record = all[normalizedEmail];

  if (!record) return false;
  if (record.expires_at < Date.now()) {
    delete all[normalizedEmail];
    localStorage.setItem(key, JSON.stringify(all));
    return false;
  }

  if (record.code !== code) return false;

  delete all[normalizedEmail];
  localStorage.setItem(key, JSON.stringify(all));
  return true;
}

export function clearEmailVerificationCode(email: string): void {
  const key = "ah_email_verification_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    unknown
  >;
  delete all[normalizeEmail(email)];
  localStorage.setItem(key, JSON.stringify(all));
}

export function generatePasswordResetCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const payload = {
    code,
    expires_at: Date.now() + 10 * 60 * 1000,
  };

  const key = "ah_password_reset_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    typeof payload
  >;
  all[normalizeEmail(email)] = payload;
  localStorage.setItem(key, JSON.stringify(all));
  localStorage.setItem("ah_password_reset_email", normalizeEmail(email));
  return code;
}

export function verifyPasswordResetCode(email: string, code: string): boolean {
  const key = "ah_password_reset_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    { code: string; expires_at: number }
  >;
  const normalizedEmail = normalizeEmail(email);
  const record = all[normalizedEmail];

  if (!record) return false;
  if (record.expires_at < Date.now()) {
    delete all[normalizedEmail];
    localStorage.setItem(key, JSON.stringify(all));
    return false;
  }

  if (record.code !== code) return false;

  delete all[normalizedEmail];
  localStorage.setItem(key, JSON.stringify(all));
  return true;
}

export function clearPasswordResetCode(email: string): void {
  const key = "ah_password_reset_codes";
  const all = JSON.parse(localStorage.getItem(key) || "{}") as Record<
    string,
    unknown
  >;
  delete all[normalizeEmail(email)];
  localStorage.setItem(key, JSON.stringify(all));
}

// Initialize default admin user
export function initializeDefaultAdmin(): void {
  const users = getUsers();
  const adminExists = users.some(
    (u) => u.email === "admin@addishospitality.et",
  );

  if (!adminExists) {
    const adminUser: LocalUser = {
      id: "admin-001",
      email: "admin@addishospitality.et",
      password: "AddisAdmin2026!",
      role: "admin",
      full_name: "Admin",
      phone: "+251911000000",
      status: "active",
      email_verified: true,
      created_at: new Date().toISOString(),
    };
    users.push(adminUser);
    saveUsers(users);
  }
}

// Call initialization on module load
if (typeof window !== "undefined") {
  initializeDefaultAdmin();
}

// Jobs
export function getJobs(companyId?: string): Job[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    const jobs: Job[] = data ? JSON.parse(data) : [];
    return companyId ? jobs.filter((j) => j.company_id === companyId) : jobs;
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]): void {
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export function createJob(
  companyId: string,
  title: string,
  description: string,
  location: string,
  employmentType: "full-time" | "part-time" | "contract" | "temporary",
  requirements: string[],
  salaryMin?: number,
  salaryMax?: number,
): Job {
  const job: Job = {
    id: Math.random().toString(36).substr(2, 9),
    company_id: companyId,
    title,
    description,
    location,
    employment_type: employmentType,
    requirements,
    salary_min: salaryMin,
    salary_max: salaryMax,
    posted_date: new Date().toISOString(),
    status: "open",
  };
  const jobs = getJobs();
  jobs.push(job);
  saveJobs(jobs);
  return job;
}

export function getJob(jobId: string): Job | undefined {
  return getJobs().find((j) => j.id === jobId);
}

export function updateJobStatus(
  jobId: string,
  status: "open" | "closed",
): void {
  const jobs = getJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (job) {
    job.status = status;
    saveJobs(jobs);
  }
}

export function deleteJob(jobId: string): void {
  const jobs = getJobs().filter((j) => j.id !== jobId);
  saveJobs(jobs);
}

// Job Applications
export function getJobApplications(filter?: {
  jobId?: string;
  employeeId?: string;
  companyId?: string;
}): JobApplication[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.JOB_APPLICATIONS);
    const applications: JobApplication[] = data ? JSON.parse(data) : [];

    if (!filter) return applications;

    return applications.filter((app) => {
      if (filter.jobId && app.job_id !== filter.jobId) return false;
      if (filter.employeeId && app.employee_id !== filter.employeeId)
        return false;
      if (filter.companyId) {
        const job = getJob(app.job_id);
        if (!job || job.company_id !== filter.companyId) return false;
      }
      return true;
    });
  } catch {
    return [];
  }
}

export function saveJobApplications(applications: JobApplication[]): void {
  localStorage.setItem(
    STORAGE_KEYS.JOB_APPLICATIONS,
    JSON.stringify(applications),
  );
}

export function createJobApplication(
  jobId: string,
  employeeId: string,
  coverLetter?: string,
): JobApplication | null {
  const job = getJob(jobId);
  if (!job) return null;

  // Check if employee already applied
  const existing = getJobApplications({ jobId, employeeId });
  if (existing.length > 0) return null;

  const application: JobApplication = {
    id: Math.random().toString(36).substr(2, 9),
    job_id: jobId,
    employee_id: employeeId,
    applied_date: new Date().toISOString(),
    status: "applied",
    cover_letter: coverLetter,
  };

  const applications = getJobApplications();
  applications.push(application);
  saveJobApplications(applications);
  return application;
}

export function getJobApplication(
  applicationId: string,
): JobApplication | undefined {
  return getJobApplications().find((a) => a.id === applicationId);
}

export function updateJobApplicationStatus(
  applicationId: string,
  status: JobApplication["status"],
  notes?: string,
): void {
  const applications = getJobApplications();
  const app = applications.find((a) => a.id === applicationId);
  if (app) {
    app.status = status;
    if (status === "interview_scheduled" && notes) {
      app.interview_notes = notes;
    } else if (status === "rejected" && notes) {
      app.rejection_reason = notes;
    }
    saveJobApplications(applications);
  }
}

export function withdrawJobApplication(applicationId: string): void {
  const applications = getJobApplications();
  const app = applications.find((a) => a.id === applicationId);
  if (app) {
    app.status = "withdrawn";
    saveJobApplications(applications);
  }
}
