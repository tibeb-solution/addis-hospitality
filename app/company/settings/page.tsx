"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getCompanyProfile,
  getCurrentUser,
  setCurrentUser,
  updateCompanyProfile,
} from "@/lib/local-storage";
import { Mail, Lock, Building, Eye, EyeOff } from "lucide-react";

export default function CompanySettings() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    contact_phone: "",
    contact_person: "",
  });
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    const profile = getCompanyProfile(currentUser.id);
    setUser(currentUser);
    setFormData({
      company_name: profile?.company_name || currentUser.full_name || "",
      email: currentUser.email || "",
      contact_phone: profile?.contact_phone || currentUser.phone || "",
      contact_person: profile?.contact_person || currentUser.full_name || "",
    });
    setLoading(false);
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const profile = getCompanyProfile(user.id) || { id: user.id, email: user.email };
    const updatedProfile = {
      ...profile,
      company_name: formData.company_name,
      contact_phone: formData.contact_phone,
      contact_person: formData.contact_person,
    };

    updateCompanyProfile(user.id, updatedProfile);
    setCurrentUser({ ...user, full_name: formData.company_name, phone: formData.contact_phone || user.phone });
    setUser({ ...user, full_name: formData.company_name, phone: formData.contact_phone || user.phone });

    setMessageType("success");
    setMessage("Company settings updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (password.current !== user.password) {
      setMessageType("error");
      setMessage("Current password is incorrect");
      return;
    }

    if (password.new !== password.confirm) {
      setMessageType("error");
      setMessage("New passwords do not match");
      return;
    }

    if (password.new.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters");
      return;
    }

    const updated = { ...user, password: password.new };
    setCurrentUser(updated);
    setUser(updated);
    setPassword({ current: "", new: "", confirm: "" });

    setMessageType("success");
    setMessage("Password changed successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("nav.settings")}</h1>
        <p className="text-muted-foreground">
          Manage your company settings and preferences
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Company Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Company Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              {t("common.save")}
            </Button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={password.current}
                  onChange={(e) =>
                    setPassword({ ...password, current: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={password.new}
                onChange={(e) =>
                  setPassword({ ...password, new: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={password.confirm}
                onChange={(e) =>
                  setPassword({ ...password, confirm: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Change Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
