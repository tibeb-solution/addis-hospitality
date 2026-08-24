"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Notification, recruitment } from "@/lib/recruitment";

export default function CompanyNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const authUser = (await createClient().auth.getUser()).data.user;
      const user = isSupabaseConfigured() ? authUser : getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setNotifications(await recruitment.notifications(user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 10000);
    return () => window.clearInterval(timer);
  }, [router]);

  const markRead = async (notification: Notification) => {
    try {
      await recruitment.markRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to mark notification as read.");
    }
  };

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-1 text-muted-foreground">Updates about applicants forwarded by admin and your hiring activity.</p>
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notifications.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">No notifications yet.</p>
      ) : (
        <section className="space-y-3">
          {notifications.map((notification) => (
            <article key={notification.id} className={`rounded-lg border p-4 ${notification.read_at ? "border-border bg-card" : "border-primary bg-primary/5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{notification.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                {!notification.read_at && <Button size="sm" variant="outline" onClick={() => void markRead(notification)}>Mark as read</Button>}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
