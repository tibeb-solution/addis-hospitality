"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getCurrentUser,
  getEmployeeProfile,
  updateEmployeeProfile,
} from "@/lib/local-storage";
import EmployeeCvPreview, {
  CvData,
  ListItem,
  Reference,
} from "@/components/employee-cv-preview";
import {
  EDUCATION_QUALIFICATIONS,
  HOSPITALITY_SKILLS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITIES,
} from "@/lib/nationalities";
import { Button } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileUser,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

const emptyItem = (): ListItem => ({ title: "", detail: "" });
const emptyReference = (): Reference => ({
  name: "",
  role: "",
  company: "",
  phone: "",
  email: "",
});

function initialCv(profile: any): CvData {
  return {
    contact: {
      fullName: profile?.full_name || "",
      title: profile?.desired_position || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: [profile?.residence_area, profile?.residence_city]
        .filter(Boolean)
        .join(", "),
    },
    personal: {
      dateOfBirth: profile?.date_of_birth || "",
      nationality: profile?.nationality || "Ethiopian",
      gender: profile?.gender || "",
      maritalStatus: profile?.marital_status || "",
    },
    summary: profile?.bio || "",
    experience: profile?.cv_data?.experience || [emptyItem()],
    education: profile?.cv_data?.education || [
      { title: profile?.highest_education || "", detail: "" },
    ],
    skills: Array.isArray(profile?.skills)
      ? profile.skills.join(", ")
      : profile?.skills || "",
    certifications: profile?.cv_data?.certifications || [emptyItem()],
    achievements: profile?.cv_data?.achievements || "",
    languages: Array.isArray(profile?.languages)
      ? profile.languages.join(", ")
      : profile?.languages || "",
    references: profile?.cv_data?.references || [emptyReference()],
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Select...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">{placeholder}</option>
        {value && !options.includes(value as any) && (
          <option value={value}>{value}</option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function EmployeeCvPage() {
  const router = useRouter();
  const previewOnly = usePathname() === "/employee/cv";
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [cv, setCv] = useState<CvData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }
        const [{ data: employee }, { data: account }, { data: savedCv }] =
          await Promise.all([
            supabase
              .from("employee_profiles")
              .select("*")
              .eq("id", authUser.id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("*")
              .eq("id", authUser.id)
              .maybeSingle(),
            supabase
              .from("employee_cvs")
              .select("*")
              .eq("employee_id", authUser.id)
              .maybeSingle(),
          ]);
        const merged = {
          ...authUser,
          ...account,
          ...employee,
          email: authUser.email,
        };
        setUser(authUser);
        setProfile(merged);
        setCv(
          savedCv?.data
            ? { ...initialCv(merged), ...savedCv.data }
            : initialCv(merged)
        );
        setStatus(savedCv?.status || "draft");
        if (employee?.avatar_url) {
          const { data: signed } = supabase.storage
            .from("avatars")
            .getPublicUrl(employee.avatar_url);
          setAvatarUrl(signed.publicUrl || "");
        }
      } else {
        const current = getCurrentUser();
        if (!current) {
          router.push("/auth/login");
          return;
        }
        const employee = getEmployeeProfile(current.id) || current;
        setUser(current);
        setProfile({ ...current, ...employee });
        setCv(initialCv({ ...current, ...employee }));
        setStatus((employee as any).cv_status || "draft");
        if ((employee as any)?.avatar_url) {
          setAvatarUrl((employee as any).avatar_url);
        }
      }
      setLoading(false);
    };
    void load();
  }, [router]);

  const selectedSkills = useMemo(() => {
    if (!cv?.skills) return [];
    if (cv.skills.includes("\n")) {
      return cv.skills
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const found: string[] = [];
    let remaining = cv.skills;
    for (const skill of HOSPITALITY_SKILLS) {
      if (remaining.includes(skill)) {
        found.push(skill);
        remaining = remaining.replace(skill, "");
      }
    }
    if (found.length > 0) return found;
    return cv.skills
      .split(/,|\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [cv?.skills]);

  const toggleSkill = (skill: string) => {
    if (!cv) return;
    if (selectedSkills.includes(skill)) {
      const next = selectedSkills.filter((s) => s !== skill);
      update({ skills: next.join("\n") });
    } else {
      if (selectedSkills.length >= 5) return;
      const next = [...selectedSkills, skill];
      update({ skills: next.join("\n") });
    }
  };

  const requiredFields = useMemo(
    () =>
      cv
        ? [
            cv.contact.fullName,
            cv.contact.title,
            cv.contact.email,
            cv.contact.phone,
            cv.personal.dateOfBirth,
            cv.personal.nationality,
            cv.summary,
            cv.experience.some((item) => item.title && item.detail),
            cv.education.some((item) => item.title && item.detail),
            cv.skills,
            cv.certifications.some((item) => item.title && item.detail),
            cv.achievements,
            cv.languages,
            cv.references.some(
              (item) =>
                item.name &&
                item.role &&
                item.company &&
                item.phone &&
                item.email
            ),
          ]
        : [],
    [cv]
  );
  const complete = requiredFields.filter(Boolean).length;
  const isComplete =
    complete === requiredFields.length && requiredFields.length > 0;

  const update = (change: Partial<CvData>) =>
    setCv((current) => (current ? { ...current, ...change } : current));
  const updateList = (
    key: "experience" | "education" | "certifications",
    index: number,
    value: Partial<ListItem>
  ) =>
    update({
      [key]: cv![key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...value } : item
      ),
    } as Partial<CvData>);
  const updateReference = (index: number, value: Partial<Reference>) =>
    update({
      references: cv!.references.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...value } : item
      ),
    });

  const save = async (nextStatus = "draft") => {
    if (!user || !cv) return;
    setSaving(true);
    setMessage("");
    try {
      if (isSupabaseConfigured()) {
        const { error } = await createClient()
          .from("employee_cvs")
          .upsert(
            {
              employee_id: user.id,
              data: cv,
              status: nextStatus,
              submitted_at:
                nextStatus === "submitted"
                  ? new Date().toISOString()
                  : undefined,
            },
            { onConflict: "employee_id" }
          );
        if (error) throw error;
      } else {
        updateEmployeeProfile(user.id, {
          cv_data: cv,
          cv_status: nextStatus,
        } as any);
      }
      setStatus(nextStatus);
      setMessage(
        nextStatus === "submitted"
          ? "Your CV has been sent to admin for review."
          : "CV saved."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save CV.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cv) return <div>{"Loading..."}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FileUser className="h-7 w-7 text-primary" />
            My CV
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {previewOnly
              ? "Your profile information generates this CV automatically."
              : "Complete your CV details from your profile, preview it here, then submit it for admin review."}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
            status === "approved"
              ? "bg-green-500/10 text-green-700"
              : status === "rejected"
              ? "bg-red-500/10 text-red-700"
              : status === "submitted"
              ? "bg-amber-500/10 text-amber-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "approved" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : status === "rejected" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
          {status === "submitted"
            ? "Awaiting admin review"
            : status[0].toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,760px)] xl:items-start">
          {!previewOnly && <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void save();
          }}
          className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="rounded-lg bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>CV completeness</span>
              <span>
                {complete}/{requiredFields.length}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    (complete / Math.max(requiredFields.length, 1)) * 100
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              All required sections must be complete before submission.
            </p>
          </div>

          <Section title="Contact Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                required
                value={cv.contact.fullName}
                onChange={(value) =>
                  update({ contact: { ...cv.contact, fullName: value } })
                }
              />
              <Field
                label="Professional title"
                required
                value={cv.contact.title}
                onChange={(value) =>
                  update({ contact: { ...cv.contact, title: value } })
                }
              />
              <Field
                label="Email"
                required
                type="email"
                value={cv.contact.email}
                onChange={(value) =>
                  update({ contact: { ...cv.contact, email: value } })
                }
              />
              <Field
                label="Phone"
                required
                value={cv.contact.phone}
                onChange={(value) =>
                  update({ contact: { ...cv.contact, phone: value } })
                }
              />
            </div>
            <Field
              label="Address"
              value={cv.contact.address}
              onChange={(value) =>
                update({ contact: { ...cv.contact, address: value } })
              }
            />
          </Section>

          <Section title="Personal Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date of birth"
                required
                type="date"
                value={cv.personal.dateOfBirth}
                onChange={(value) =>
                  update({
                    personal: { ...cv.personal, dateOfBirth: value },
                  })
                }
              />
              <SelectField
                label="Nationality"
                required
                options={NATIONALITIES}
                value={cv.personal.nationality}
                onChange={(value) =>
                  update({
                    personal: { ...cv.personal, nationality: value },
                  })
                }
                placeholder="Select nationality"
              />
              <Field
                label="Gender"
                value={cv.personal.gender}
                onChange={(value) =>
                  update({ personal: { ...cv.personal, gender: value } })
                }
              />
              <SelectField
                label="Marital status"
                options={MARITAL_STATUS_OPTIONS}
                value={cv.personal.maritalStatus}
                onChange={(value) =>
                  update({
                    personal: { ...cv.personal, maritalStatus: value },
                  })
                }
                placeholder="Select marital status"
              />
            </div>
          </Section>

          <Section title="Professional Summary">
            <textarea
              required
              value={cv.summary}
              onChange={(event) => update({ summary: event.target.value })}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe your hospitality background, key strengths, and career objective..."
            />
          </Section>

          {/* Work Experience */}
          <Section title="Work Experience">
            <div className="space-y-4">
              {cv.experience.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Job title and employer"
                        required
                        value={item.title}
                        onChange={(value) =>
                          updateList("experience", index, { title: value })
                        }
                        placeholder="e.g. Operations Manager | Golden Tulip Hotel"
                      />
                      <label className="space-y-1.5 text-sm font-medium">
                        <span>Details & Responsibilities</span>
                        <textarea
                          required
                          value={item.detail}
                          onChange={(event) =>
                            updateList("experience", index, {
                              detail: event.target.value,
                            })
                          }
                          rows={3}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="• Oversee daily operations...&#10;• Manage service staff and inventory..."
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove entry"
                      className="mt-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update({
                          experience: cv.experience.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update({ experience: [...cv.experience, emptyItem()] })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add experience
              </Button>
            </div>
          </Section>

          {/* Education */}
          <Section title="Education">
            <div className="space-y-4">
              {cv.education.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <SelectField
                        label="Qualification / Degree"
                        required
                        options={EDUCATION_QUALIFICATIONS}
                        value={item.title}
                        onChange={(value) =>
                          updateList("education", index, { title: value })
                        }
                        placeholder="Select qualification"
                      />
                      <Field
                        label="Institution, School & Years"
                        required
                        value={item.detail}
                        onChange={(value) =>
                          updateList("education", index, { detail: value })
                        }
                        placeholder="e.g. Ethiopian Tour & Hotel College (2012 – 2014)"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove entry"
                      className="mt-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update({
                          education: cv.education.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update({ education: [...cv.education, emptyItem()] })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add education
              </Button>
            </div>
          </Section>

          {/* Training & Certifications */}
          <Section title="Training & Certifications">
            <div className="space-y-4">
              {cv.certifications.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Certificate / Course Name"
                        required
                        value={item.title}
                        onChange={(value) =>
                          updateList("certifications", index, {
                            title: value,
                          })
                        }
                        placeholder="e.g. Food Safety and Hygiene"
                      />
                      <Field
                        label="Issuing Organization & Year"
                        required
                        value={item.detail}
                        onChange={(value) =>
                          updateList("certifications", index, {
                            detail: value,
                          })
                        }
                        placeholder="e.g. Bureau Veritas (2020)"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove entry"
                      className="mt-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update({
                          certifications: cv.certifications.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update({
                    certifications: [...cv.certifications, emptyItem()],
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add certification
              </Button>
            </div>
          </Section>

          {/* Skills (Choose at most 5) */}
          <Section title="Skills">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Select at most 5 skills that best represent your capabilities.
                </p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedSkills.length === 5
                      ? "bg-primary/20 text-primary"
                      : selectedSkills.length > 0
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {selectedSkills.length} / 5 selected
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {HOSPITALITY_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  const isDisabled = !isSelected && selectedSkills.length >= 5;
                  return (
                    <button
                      key={skill}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleSkill(skill)}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                          : isDisabled
                          ? "border-border/50 opacity-45 cursor-not-allowed text-muted-foreground"
                          : "border-border bg-background hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="flex-1 leading-snug">{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Key Achievements */}
          <Section title="Key Achievements">
            <textarea
              required
              value={cv.achievements}
              onChange={(event) =>
                update({ achievements: event.target.value })
              }
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="• Improved guest satisfaction score from 82% to 94%...&#10;• Increased restaurant sales by 18%..."
            />
          </Section>

          {/* Languages */}
          <Section title="Languages">
            <textarea
              required
              value={cv.languages}
              onChange={(event) =>
                update({ languages: event.target.value })
              }
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Amharic — Native, English — Fluent"
            />
          </Section>

          {/* References */}
          <Section title="References">
            <div className="space-y-4">
              {cv.references.map((reference, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                >
                  {(["name", "role", "company", "phone", "email"] as const).map(
                    (field) => (
                      <Field
                        key={field}
                        label={
                          field === "name"
                            ? "Reference name"
                            : field[0].toUpperCase() + field.slice(1)
                        }
                        required
                        value={reference[field]}
                        onChange={(value) =>
                          updateReference(index, { [field]: value })
                        }
                        type={field === "email" ? "email" : "text"}
                      />
                    )
                  )}
                  <button
                    type="button"
                    className="text-left text-xs text-destructive sm:col-span-2"
                    onClick={() =>
                      update({
                        references: cv.references.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      })
                    }
                  >
                    Remove reference
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update({ references: [...cv.references, emptyReference()] })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add reference
              </Button>
            </div>
          </Section>

          {message && (
            <p className="rounded-md bg-muted p-3 text-sm">{message}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="outline" disabled={saving}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              type="button"
              disabled={saving || !isComplete || status === "submitted"}
              onClick={() => void save("submitted")}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for review
            </Button>
          </div>
        </form>}

        <div className={`${previewOnly ? "xl:col-span-2" : ""} space-y-4 xl:sticky xl:top-24`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Eye className="h-5 w-5 text-primary" />
              {previewOnly ? "My generated CV" : "Live preview"}
            </h2>
            {status === "approved" && (
              <Button size="sm" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          {previewOnly && status !== "approved" && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Download becomes available after admin approval.
            </p>
          )}
          <EmployeeCvPreview cv={cv} avatarUrl={avatarUrl} />
        </div>
      </div>
    </div>
  );
}
