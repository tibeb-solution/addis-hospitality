"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/local-storage";
import { Interview, Notification, recruitment } from "@/lib/recruitment";

export default function EmployeeSchedulePage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");

  const refresh = () => {
    const user = getCurrentUser();
    if (!user) return;
    setInterviews(
      recruitment
        .interviews()
        .filter((interview) => interview.employee_id === user.id)
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
    );
    setNotifications(recruitment.notifications(user.id));
  };

  useEffect(() => {
    refresh();
  }, []);

  const respond = (interview: Interview, status: "accepted" | "declined") => {
    recruitment.respondToInterview(interview.id, status);
    setMessage(`Interview ${status}.`);
    refresh();
  };

  const markRead = (notification: Notification) => {
    recruitment.markRead(notification.id);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule & notifications</h1>
        <p className="mt-1 text-muted-foreground">
          View interview invitations and updates about your applications.
        </p>
        {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Interview schedule</h2>
        {interviews.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
            No interviews scheduled yet.
          </p>
        ) : (
          interviews.map((interview) => (
            <article
              key={interview.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">Interview invitation</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(interview.starts_at).toLocaleString()} |{" "}
                    {interview.meeting_type.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm">{interview.location_or_link}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    Status: {interview.status}
                  </p>
                </div>
                {interview.status === "proposed" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respond(interview, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respond(interview, "declined")}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-lg border bg-card p-4 ${notification.read_at ? "border-border" : "border-primary"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markRead(notification)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
