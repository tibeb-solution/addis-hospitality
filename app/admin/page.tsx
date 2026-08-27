"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { recruitment } from "@/lib/recruitment";
import { getEmployeeProfile } from "@/lib/local-storage";

export default function AdminDashboard() {
  const t = useTranslations();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalCompanies: 0,
    activeAccounts: 0,
    pendingApproval: 0,
    rejectedAccounts: 0,
    suspendedAccounts: 0,
  });
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [hiringNotifications, setHiringNotifications] = useState<any[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: profiles } = await supabase
          .from("profiles")
          .select(
            "id, email, full_name, role, status, email_verified, created_at",
          );

        const empCount = (profiles || []).filter(
          (profile: any) => profile.role === "employee",
        ).length;
        const compCount = (profiles || []).filter(
          (profile: any) => profile.role === "company",
        ).length;

        const [jobs, notifications, interviews, applications] = await Promise.all([
          recruitment.jobs(),
          recruitment.notifications(user?.id || "admin-001"),
          recruitment.interviews(),
          recruitment.applications(),
        ]);

        const statusMap =
          profiles?.reduce((acc: any, profile: any) => {
          acc[profile.status] = (acc[profile.status] || 0) + 1;
          return acc;
        }, {}) || {};

        setPendingAccounts(
          (profiles || [])
            .filter(
              (profile: any) =>
                profile.status !== "active" || profile.email_verified === false,
            )
            .slice(0, 5),
        );

        setPendingJobs(jobs.filter((job) => job.status === "pending_review").slice(0, 5));
        setApplicationCounts(
          applications.reduce<Record<string, number>>((counts, application) => {
            counts[application.job_id] = (counts[application.job_id] || 0) + 1;
            return counts;
          }, {}),
        );
        setHiringNotifications(notifications.filter((notification) => ["application", "interview"].includes(notification.type)).slice(0, 8));
        setScheduledInterviews(
          interviews
            .map((interview) => {
              const application = applications.find((item) => item.id === interview.application_id);
              const job = jobs.find((item) => item.id === application?.job_id);
              const employee =
                getEmployeeProfile(interview.employee_id) ||
                profiles?.find((profile: any) => profile.id === interview.employee_id);
              return {
                ...interview,
                employeeName: employee?.full_name || "Employee",
                jobTitle: job?.title || "Job application",
              };
            })
            .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
        );

        setStats({
          totalEmployees: empCount || 0,
          totalCompanies: compCount || 0,
          activeAccounts: statusMap.active || 0,
          pendingApproval: statusMap.pending || 0,
          rejectedAccounts: statusMap.rejected || 0,
          suspendedAccounts: statusMap.suspended || 0,
        });
      } catch (error) {
        console.error("Unable to load admin dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  const StatCard = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="bg-card border border-border rounded-lg p-6 space-y-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t("admin.dashboard")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          {t("admin.title")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <StatCard
          label={t("admin.totalEmployees")}
          value={stats.totalEmployees}
          color="text-primary"
        />
        <StatCard
          label={t("admin.totalCompanies")}
          value={stats.totalCompanies}
          color="text-accent"
        />
        <StatCard
          label={t("admin.activeAccounts")}
          value={stats.activeAccounts}
          color="text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label={t("admin.pendingApproval")}
          value={stats.pendingApproval}
          color="text-yellow-600"
        />
        <StatCard
          label={t("admin.rejectedAccounts")}
          value={stats.rejectedAccounts}
          color="text-destructive"
        />
        <StatCard
          label={t("admin.suspendedAccounts")}
          value={stats.suspendedAccounts}
          color="text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending account reviews</h2>
            <Link
              href="/admin/employees"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {pendingAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending account approvals.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingAccounts.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {profile.full_name || profile.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.role} · {profile.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium capitalize text-yellow-700">
                    {profile.email_verified === false
                      ? "Email not verified"
                      : profile.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending job approvals</h2>
            <Link
              href="/admin/jobs"
              className="text-sm text-primary hover:underline"
            >
              Open queue
            </Link>
          </div>
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs awaiting approval.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company_name} | Age {job.min_age ?? 18}-{job.max_age ?? 65} | {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : "No expiry"} | {applicationCounts[job.id] || 0} applicants
                    </p>
                  </div>
                  <Link href={`/admin/jobs/${job.id}`} className="shrink-0 text-sm text-primary hover:underline">
                    View details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Hiring activity</h2>
          <Link
            href="/admin/employees"
            className="text-sm text-primary hover:underline"
          >
            Employee list
          </Link>
        </div>
        {hiringNotifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applications, interviews, or hires yet.
          </p>
        ) : (
          <div className="space-y-3">
            {hiringNotifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-muted-foreground">
                  {notification.body}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Scheduled interviews</h2>
        {scheduledInterviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No employee interviews have been scheduled.
          </p>
        ) : (
          <div className="space-y-3">
            {scheduledInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{interview.employeeName}</p>
                  <p className="text-sm text-muted-foreground">
                    Job: {interview.jobTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(interview.starts_at).toLocaleString()} |{" "}
                    {interview.meeting_type.replace("_", " ")}
                  </p>
                  <p className="text-sm">{interview.location_or_link}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                  {interview.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">{t("admin.action")}</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/employees">
            <Button>{t("admin.employeeList")}</Button>
          </Link>
          <Link href="/admin/companies">
            <Button variant="outline">{t("admin.companyList")}</Button>
          </Link>
          <Link href="/admin/jobs">
            <Button variant="outline">Job Approvals</Button>
          </Link>
          <Link href="/admin/audit">
            <Button variant="outline">{t("admin.auditLog")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
