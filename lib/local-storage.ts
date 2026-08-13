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
  security_questions?: { question: string; answer: string }[];
}

export interface EmployeeProfile extends LocalUser {
  avatar_path?: string;
  desired_position?: string;
  years_experience?: number;
  preferred_cities?: string;
  expected_salary_min?: number;
  expected_salary_max?: number;
  skills?: string[];
  bio?: string;
}

export interface CompanyProfile extends LocalUser {
  company_name?: string;
  logo_path?: string;
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

const STORAGE_KEYS = {
  USERS: "ah_users",
  CURRENT_USER: "ah_current_user",
  EMPLOYEE_PROFILES: "ah_employee_profiles",
  COMPANY_PROFILES: "ah_company_profiles",
  DOCUMENTS: "ah_documents",
  AUDIT_LOG: "ah_audit_log",
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
  const newUser: LocalUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password, // In production, hash this!
    role,
    full_name: data.full_name || data.company_name || "",
    phone: data.phone || "",
    status: role === "company" ? "pending" : "active",
    // Local mode has no email service, so newly created accounts are usable immediately.
    email_verified: true,
    created_at: registeredAt,
    security_questions: data.security_questions || undefined,
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

export function verifySecurityAnswers(
  email: string,
  answers: string[],
): boolean {
  const user = findUserByEmail(email);
  if (!user || !user.security_questions) return false;
  if (user.security_questions.length !== answers.length) return false;
  for (let i = 0; i < answers.length; i++) {
    if (
      (user.security_questions[i].answer || "").trim().toLowerCase() !==
      (answers[i] || "").trim().toLowerCase()
    ) {
      return false;
    }
  }
  return true;
}

export function findUserByEmail(email: string): LocalUser | undefined {
  return getUsers().find((u) => u.email === email);
}

export function findUserById(id: string): LocalUser | undefined {
  return getUsers().find((u) => u.id === id);
}

// Current session
export function getCurrentUser(): LocalUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: LocalUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
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
    saveEmployeeProfiles(profiles);
  }
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
    saveUsers(users);
  }
}

export function updateUserPasswordByEmail(
  email: string,
  newPassword: string,
): boolean {
  const users = getUsers();
  const index = users.findIndex((u) => u.email === email);
  if (index === -1) return false;

  users[index].password = newPassword;
  saveUsers(users);
  return true;
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
