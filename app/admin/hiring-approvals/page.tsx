"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { recruitment } from "@/lib/recruitment";

export default function AdminHiringApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadRequests = async () => {
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, role");
    const [{ data: companyProfiles }, { data: employeeProfiles }] =
      await Promise.all([
        supabase.from("company_profiles").select("id, company_name"),
        supabase
          .from("employee_profiles")
          .select(
            "id, full_name, desired_position, years_experience, highest_education",
          ),
      ]);

    const companyMap = new Map(
      (companyProfiles || []).map((profile: any) => [
        profile.id,
        profile.company_name || "Company",
      ]),
    );
    const employeeMap = new Map(
      (employeeProfiles || []).map((profile: any) => [profile.id, profile]),
    );
    const profileMap = new Map(
      (profiles || []).map((profile: any) => [profile.id, profile]),
    );

    const rows = (await recruitment.hiringRequests())
      .map((request) => {
        const profile = (profileMap.get(request.company_id) ||
          profileMap.get(request.employee_id)) as
          | Record<string, any>
          | undefined;
        const employee = (employeeMap.get(request.employee_id) ||
          profileMap.get(request.employee_id)) as
          | Record<string, any>
          | undefined;
        return {
          ...request,
          companyName:
            companyMap.get(request.company_id) ||
            profile?.["full_name"] ||
            "Company",
          employeeName:
            employee?.["full_name"] || employee?.["company_name"] || "Employee",
          desiredPosition: employee?.["desired_position"] || "—",
          yearsExperience: employee?.["years_experience"] ?? "—",
          education: employee?.["highest_education"] || "—",
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleReview = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    await recruitment.reviewHiringRequest(requestId, status);
    setNotice(
      status === "approved"
        ? "Hiring request approved."
        : "Hiring request rejected.",
    );
    await loadRequests();
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading hiring approvals...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hiring approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve or reject company hiring requests before final
          selection is confirmed.
        </p>
      </div>

      {notice && (
        <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          {notice}
        </p>
      )}

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          There are no hiring requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {request.companyName}
                    </h2>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize text-foreground">
                      {request.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requested employee:{" "}
                    <span className="font-medium text-foreground">
                      {request.employeeName}
                    </span>
                  </p>
                  <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Position
                      </dt>
                      <dd className="text-foreground">
                        {request.desiredPosition}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Experience
                      </dt>
                      <dd className="text-foreground">
                        {request.yearsExperience}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">
                        Education
                      </dt>
                      <dd className="text-foreground">{request.education}</dd>
                    </div>
                  </dl>
                  {request.manager_note && (
                    <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground/80">
                      {request.manager_note}
                    </p>
                  )}
                </div>

                {request.status === "pending_approval" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void handleReview(request.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleReview(request.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
