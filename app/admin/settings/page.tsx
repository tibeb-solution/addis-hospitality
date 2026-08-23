"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getCurrentUser, setCurrentUser } from "@/lib/local-storage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Shield } from "lucide-react";

export default function AdminSettings() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/auth/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (profile?.role !== "admin") {
          router.push("/auth/login");
          return;
        }

        const currentUser = {
          ...authUser,
          ...profile,
          id: authUser.id,
          email: authUser.email || "",
        };
        setUser(currentUser);
        setFormData({
          full_name: profile.full_name || "",
          email: authUser.email || "",
        });
        setLoading(false);
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== "admin") {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
      });
      setLoading(false);
    };

    void loadUser();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isSupabaseConfigured()) {
      const { error } = await createClient()
        .from("profiles")
        .update({ full_name: formData.full_name })
        .eq("id", user.id);
      if (error) {
        setMessage(error.message);
        return;
      }
    }

    const updated = { ...user, full_name: formData.full_name };
    setCurrentUser(updated);
    setUser(updated);

    setMessage("Admin settings updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="max-w-2xl sm:max-w-3xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("nav.settings")}</h1>
        <p className="text-muted-foreground">
          Manage your admin account settings and preferences
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Admin Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Admin Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              {t("common.save")}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
