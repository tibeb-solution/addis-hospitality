"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employee/settings");
  }, [router]);

  return null;
}
              <input
                name="phone"
                required
                defaultValue={profile?.phone}
                placeholder="+251..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.gender")} <span className="text-destructive">*</span>
              </label>
              <select
                name="gender"
                required
                defaultValue={profile?.gender || ""}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t("employee.gender")}</option>
                {["male", "female", "other", "prefer_not_to_say"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`taxonomy.gender_${value}`)}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.dateOfBirth")} <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  name="date_of_birth"
                  type="date"
                  required
                  value={dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
                <span className="shrink-0 text-sm text-muted-foreground">
                  {t("employee.age")}: {getAge(dateOfBirth) ?? "-"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.alternativePhone")}
              </label>
              <input
                name="alternative_phone"
                type="tel"
                defaultValue={profile?.alternative_phone || ""}
                placeholder="e.g. +251 922 345 678"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Workplace type <span className="text-destructive">*</span></label>
              <select
                name="work_sector"
                value={workSector}
                required
                onChange={(event) => {
                  setWorkSector(event.target.value);
                  setPositionChoice("");
                }}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Choose cafe or restaurant</option>
                {WORK_SECTORS.map((sector) => (
                  <option key={sector} value={sector}>{sector === "cafe" ? "Cafe" : "Restaurant"}</option>
                ))}
              </select>
              <label className="text-sm font-medium">{t("employee.desiredPosition")} <span className="text-destructive">*</span></label>
              <PositionSearchSelect
                name="desired_position"
                value={positionChoice}
                positions={getPositionsForSector(workSector)}
                required
                placeholder="Search listed positions"
                onChange={setPositionChoice}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("employee.bio")} <span className="text-destructive">*</span></label>
            <textarea
              name="bio"
              required
              defaultValue={profile?.bio}
              placeholder={t("employee.bio")}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
            />
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="font-medium">{t("employee.currentResidence")}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["residence_city", t("employee.city")],
                ["residence_sub_city", t("employee.subCity")],
                ["residence_woreda", t("employee.woreda")],
                ["residence_area", t("employee.area")],
              ].map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <label className="text-sm font-medium">{label} <span className="text-destructive">*</span></label>
                  <input
                    name={name}
                    defaultValue={profile?.[name] || ""}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="font-medium">{t("employee.emergencyContact")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ["emergency_contact_name", t("employee.contactName")],
                ["emergency_contact_relationship", t("employee.relationship")],
                ["emergency_contact_phone", t("employee.contactPhone")],
              ].map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <label className="text-sm font-medium">{label} <span className="text-destructive">*</span></label>
                  <input
                    name={name}
                    type={name === "emergency_contact_phone" ? "tel" : "text"}
                    required
                    defaultValue={profile?.[name] || ""}
                    placeholder={name === "emergency_contact_name" ? "e.g. Abel Bekele" : name === "emergency_contact_relationship" ? "e.g. Brother" : "e.g. +251 911 234 567"}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* Job Preferences Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("employee.jobPreferences")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.yearsExperience")}
              </label>
              <input
                name="years_experience"
                type="number"
                defaultValue={profile?.years_experience}
                placeholder="5"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.highestEducation")} <span className="text-destructive">*</span>
              </label>
              <select
                name="highest_education"
                required
                defaultValue={profile?.highest_education}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t("employee.highestEducation")}</option>
                {[
                  "primary",
                  "secondary",
                  "tvet",
                  "diploma",
                  "bachelor",
                  "master",
                  "doctorate",
                ].map((level) => (
                  <option key={level} value={level}>
                    {t(`taxonomy.education_${level}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.employmentType")} <span className="text-destructive">*</span>
              </label>
              <select
                name="employment_type"
                required
                defaultValue={profile?.employment_type}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t("employee.employmentType")}</option>
                {[
                  "full_time",
                  "part_time",
                  "office_hours",
                  "contract",
                  "temporary",
                  "internship",
                ].map((type) => (
                  <option key={type} value={type}>
                    {t(`taxonomy.employment_${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.availability")} <span className="text-destructive">*</span>
              </label>
              <select
                name="availability"
                required
                defaultValue={profile?.availability}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t("employee.availability")}</option>
                {[
                  "immediately",
                  "within_two_weeks",
                  "within_a_month",
                  "not_available",
                ].map((av) => (
                  <option key={av} value={av}>
                    {t(`taxonomy.availability_${av}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Languages</label>
            <LanguageMultiSelect
              name="languages"
              value={profile?.languages || []}
              languages={LANGUAGES}
              onChange={(value) => setProfile({ ...profile, languages: value })}
            />
            <label className="text-sm font-medium">
              {t("employee.preferredCities")}
            </label>
            <input
              name="preferred_cities"
              defaultValue={profile?.preferred_cities}
              placeholder="Addis Ababa, Dire Dawa"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="willing_to_relocate"
                value="true"
                defaultChecked={profile?.willing_to_relocate}
              />
              <span className="text-sm">{t("employee.willingToRelocate")}</span>
            </label>
          </div>
        </div>

        {/* Salary Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("employee.expectedSalaryMin")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.expectedSalaryMin")}
              </label>
              <input
                name="expected_salary_min"
                type="number"
                defaultValue={profile?.expected_salary_min}
                placeholder="20000"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("employee.expectedSalaryMax")}
              </label>
              <input
                name="expected_salary_max"
                type="number"
                defaultValue={profile?.expected_salary_max}
                placeholder="50000"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? t("common.loading") : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
      <section className="space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="text-2xl font-bold">CV details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your CV information here, then save it to send it for admin review. Your generated CV preview is available from the CV menu.
          </p>
        </div>
        <EmployeeCvPage embedded showPreview={false} />
      </section>
    </div>
  );
}
