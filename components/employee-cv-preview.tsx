"use client";

import Image from "next/image";
import { useMemo } from "react";
import { HOSPITALITY_SKILLS } from "@/lib/nationalities";

export type ListItem = { title: string; detail: string };
export type Reference = {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
};

export type CvData = {
  contact: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    address: string;
  };
  personal: {
    dateOfBirth: string;
    nationality: string;
    gender: string;
    maritalStatus: string;
  };
  summary: string;
  experience: ListItem[];
  education: ListItem[];
  skills: string;
  certifications: ListItem[];
  achievements: string;
  languages: string;
  references: Reference[];
};

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function splitLines(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|•|-|\*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSkills(skills: string): string[] {
  if (!skills) return [];
  if (skills.includes("\n")) {
    return skills
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const found: string[] = [];
  let remaining = skills;
  for (const known of HOSPITALITY_SKILLS) {
    if (remaining.includes(known)) {
      found.push(known);
      remaining = remaining.replace(known, "");
    }
  }
  if (found.length > 0) {
    const others = remaining
      .split(/,|\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    return [...found, ...others];
  }
  return skills
    .split(/,|\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EmployeeCvPreview({
  cv,
  avatarUrl,
}: {
  cv: CvData;
  avatarUrl?: string | null;
}) {
  const age = useMemo(
    () => calculateAge(cv.personal.dateOfBirth),
    [cv.personal.dateOfBirth]
  );
  const skillsList = useMemo(() => parseSkills(cv.skills), [cv.skills]);
  const languagesList = useMemo(() => parseSkills(cv.languages), [cv.languages]);

  return (
    <article
      id="cv-printable-document"
      className="relative mx-auto min-h-[1100px] w-full max-w-[820px] overflow-hidden bg-white text-black shadow-2xl transition-all print:m-0 print:w-full print:max-w-none print:shadow-none font-sans"
    >
      {/* Horizontal brand watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none z-0"
      >
        <div className="relative aspect-[2.35/1] w-[62%] opacity-[0.07]">
          <Image
            src="/logo.png"
            alt="Addis Hospitality Watermark"
            fill
            className="object-contain"
            priority={false}
          />
        </div>
      </div>

      {/* Header Banner - Exact Match to Design */}
      <header
        className="relative z-10 overflow-hidden px-5 py-3 sm:px-7 sm:py-3.5 text-white"
        style={{
          backgroundColor: "#014d44",
          backgroundImage: `
            radial-gradient(ellipse at 25% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 60%, rgba(0, 0, 0, 0.18) 0%, transparent 60%),
            linear-gradient(90deg, #013d36 0%, #014d44 50%, #013f38 100%)
          `,
        }}
      >
        <div className="relative z-10 flex items-center justify-between gap-3 min-h-[64px] sm:min-h-[74px]">
          {/* Logo on Left - Natural Brand Logo */}
          <div className="flex items-center shrink-0">
            <div className="relative h-12 w-32 sm:h-14 sm:w-36 rounded-md overflow-hidden">
              <Image
                src="/logo.png"
                alt="Addis Hospitality Service"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>

          {/* Center Title: "[Employee Name] CV" */}
          <div className="flex-1 text-center px-2">
            <h1 className="text-base sm:text-xl font-bold tracking-normal text-white font-sans">
              {cv.contact.fullName
                ? `${cv.contact.fullName} CV`
                : "Employee CV"}
            </h1>
          </div>

          {/* Right Spacer for balanced centering */}
          <div className="w-32 sm:w-36 shrink-0 hidden sm:block" aria-hidden="true" />
        </div>
      </header>

      {/* Main CV Content Body */}
      <div className="relative z-10 p-6 sm:p-8 space-y-5 text-[12px] leading-relaxed text-black">
        {/* Top Profile Header: Photo & Contact Info */}
        <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-6 items-start">
          {/* Candidate Photo */}
          <div className="relative h-[150px] w-[120px] sm:h-[165px] sm:w-[140px] overflow-hidden border border-black bg-slate-100 shadow-xs shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={cv.contact.fullName || "Candidate Photo"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
                <svg
                  className="h-16 w-16 text-slate-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Job Title & Contact */}
          <div className="space-y-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-black">
                {cv.contact.title || "HOSPITALITY OPERATIONS MANAGER"}
              </h2>
            </div>

            <div className="space-y-1">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
                CONTACT
              </h3>
              <ul className="space-y-1 text-black">
                {cv.contact.phone && (
                  <li className="flex items-center gap-2">
                    <span className="text-[10px]">➤</span>
                    <span>{cv.contact.phone}</span>
                  </li>
                )}
                {cv.contact.email && (
                  <li className="flex items-center gap-2">
                    <span className="text-[10px]">➤</span>
                    <span>{cv.contact.email}</span>
                  </li>
                )}
                {cv.contact.address && (
                  <li className="flex items-center gap-2">
                    <span className="text-[10px]">➤</span>
                    <span>{cv.contact.address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <section className="space-y-1">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
            PERSONAL INFORMATION
          </h3>
          <div className="space-y-0.5 text-black text-[12px]">
            <div>
              <span className="font-bold">Date of Birth: </span>
              <span>{formatDate(cv.personal.dateOfBirth)}</span>
            </div>
            <div>
              <span className="font-bold">Age: </span>
              <span>{age !== null ? `${age} Years` : "-"}</span>
            </div>
            <div>
              <span className="font-bold">Nationality: </span>
              <span>{cv.personal.nationality || "Ethiopian"}</span>
            </div>
            <div>
              <span className="font-bold">Gender: </span>
              <span>{cv.personal.gender || "-"}</span>
            </div>
            <div>
              <span className="font-bold">Marital Status: </span>
              <span>{cv.personal.maritalStatus || "-"}</span>
            </div>
          </div>
        </section>

        {/* Professional Summary */}
        {cv.summary && (
          <section className="space-y-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              PROFESSIONAL SUMMARY
            </h3>
            <p className="text-black text-justify whitespace-pre-wrap leading-relaxed">
              {cv.summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {cv.experience && cv.experience.some((e) => e.title || e.detail) && (
          <section className="space-y-2">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              WORK EXPERIENCE
            </h3>
            <div className="space-y-3">
              {cv.experience
                .filter((item) => item.title || item.detail)
                .map((item, idx) => {
                  const bullets = splitLines(item.detail);
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold text-black text-[12px]">
                        {item.title}
                      </div>
                      {bullets.length > 1 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-black pl-1">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-black whitespace-pre-wrap leading-snug">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Education */}
        {cv.education && cv.education.some((e) => e.title || e.detail) && (
          <section className="space-y-1.5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              EDUCATION
            </h3>
            <div className="space-y-1">
              {cv.education
                .filter((item) => item.title || item.detail)
                .map((item, idx) => (
                  <div key={idx} className="text-black leading-snug">
                    <span className="font-bold">{item.title}</span>
                    {item.detail && <span> — {item.detail}</span>}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skillsList.length > 0 && (
          <section className="space-y-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              SKILLS
            </h3>
            <ul className="list-disc list-inside space-y-0.5 text-black pl-1">
              {skillsList.map((skill, idx) => (
                <li key={idx} className="leading-snug">
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Training & Certifications */}
        {cv.certifications &&
          cv.certifications.some((c) => c.title || c.detail) && (
            <section className="space-y-1">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
                TRAINING & CERTIFICATIONS
              </h3>
              <ul className="list-disc list-inside space-y-0.5 text-black pl-1">
                {cv.certifications
                  .filter((item) => item.title || item.detail)
                  .map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      <span className="font-bold">{item.title}</span>
                      {item.detail && <span> — {item.detail}</span>}
                    </li>
                  ))}
              </ul>
            </section>
          )}

        {/* Key Achievements */}
        {cv.achievements && (
          <section className="space-y-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              KEY ACHIEVEMENTS
            </h3>
            <div className="text-black leading-relaxed">
              {splitLines(cv.achievements).length > 1 ? (
                <ul className="list-disc list-inside space-y-0.5 text-black pl-1">
                  {splitLines(cv.achievements).map((ach, idx) => (
                    <li key={idx} className="leading-snug">
                      {ach}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="whitespace-pre-wrap">{cv.achievements}</p>
              )}
            </div>
          </section>
        )}

        {/* Languages */}
        {languagesList.length > 0 && (
          <section className="space-y-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
              LANGUAGES
            </h3>
            <ul className="list-disc list-inside space-y-0.5 text-black pl-1">
              {languagesList.map((lang, idx) => (
                <li key={idx} className="leading-snug">
                  {lang}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* References */}
        {cv.references &&
          cv.references.some((r) => r.name || r.role || r.company) && (
            <section className="space-y-1.5">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
                REFERENCES
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                {cv.references
                  .filter((r) => r.name || r.role || r.company)
                  .map((ref, idx) => (
                    <div key={idx} className="space-y-0.5 text-black text-[12px]">
                      <div className="font-bold">{ref.name}</div>
                      {ref.role && (
                        <div>
                          {[ref.role, ref.company].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {ref.phone && <div>{ref.phone}</div>}
                      {ref.email && <div>{ref.email}</div>}
                    </div>
                  ))}
              </div>
            </section>
          )}
      </div>

      {/* Footer - Identical to Sample PDF */}
      <footer className="relative z-10 mt-8 px-6 pb-6 pt-2 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 text-center space-y-0.5">
            <p className="text-[12px] italic text-black font-serif">
              Professional CV Sample | Addis Hospitality Solutions PLC
            </p>
            <p className="text-[11px] italic text-black font-serif">
              Visual & Verbal Identity Addis hospitality Service
            </p>
          </div>
          <div className="shrink-0 pb-1">
            <div className="relative h-10 w-28 sm:h-11 sm:w-32">
              <Image
                src="/logo.png"
                alt="Addis Hospitality Service"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
        </div>
      </footer>
    </article>
  );
}
