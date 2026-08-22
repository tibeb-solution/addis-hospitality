"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getCompanyProfile,
  getCurrentUser,
  setCurrentUser,
  updateUserPasswordByEmail,
  updateCompanyProfile,
} from "@/lib/local-storage";
import ProfilePhotoEditor from "@/components/profile-photo-editor";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mail, Lock, Building, Eye, EyeOff } from "lucide-react";

export default function CompanySettings() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    business_type: "",
    trade_license_number: "",
    tin_number: "",
    contact_person: "",
    contact_phone: "",
    region: "",
    sub_city: "",
    address: "",
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const loadSupabaseProfile = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { router.push("/auth/login"); return; }
        const { data: profile } = await supabase.from("company_profiles").select("*").eq("id", authUser.id).single();
        const account = { ...authUser, ...profile, id: authUser.id, email: authUser.email };
        setUser(account);
        setLogoPath(profile?.logo_url || null);
        setFormData({
          company_name: profile?.company_name || authUser.user_metadata?.company_name || "",
          email: authUser.email || "",
          business_type: profile?.business_type || "",
          trade_license_number: profile?.trade_license_number || "",
          tin_number: profile?.tin_number || "",
          contact_phone: profile?.contact_phone || "",
          contact_person: profile?.contact_person || "",
          region: profile?.region || "",
          sub_city: profile?.sub_city || "",
          address: profile?.address || "",
        });
        setLoading(false);
      };
      void loadSupabaseProfile();
      return;
    }
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    const profile = getCompanyProfile(currentUser.id);
    setUser(currentUser);
    setLogoPath(profile?.logo_url || null);
    setFormData({
      company_name: profile?.company_name || currentUser.full_name || "",
      email: currentUser.email || "",
      business_type: profile?.business_type || "",
      trade_license_number: profile?.trade_license_number || "",
      tin_number: profile?.tin_number || "",
      contact_phone: profile?.contact_phone || currentUser.phone || "",
      contact_person: profile?.contact_person || currentUser.full_name || "",
      region: profile?.region || "",
      sub_city: profile?.sub_city || "",
      address: profile?.address || "",
    });
    setLoading(false);
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const profile = getCompanyProfile(user.id) || {
      id: user.id,
      email: user.email,
    };
    const updatedProfile = {
      ...profile,
      company_name: formData.company_name,
      business_type: formData.business_type,
      trade_license_number: formData.trade_license_number,
      tin_number: formData.tin_number,
      contact_phone: formData.contact_phone,
      contact_person: formData.contact_person,
      region: formData.region,
      sub_city: formData.sub_city,
      address: formData.address,
    };

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.from("company_profiles").upsert({ id: user.id, ...updatedProfile });
      if (error) { setMessageType("error"); setMessage(error.message); return; }
      const { error: accountError } = await supabase.from("profiles").update({ full_name: formData.company_name, phone: formData.contact_phone }).eq("id", user.id);
      if (accountError) { setMessageType("error"); setMessage(accountError.message); return; }
    } else {
      updateCompanyProfile(user.id, updatedProfile);
    }
    setCurrentUser({
      ...user,
      full_name: formData.company_name,
      phone: formData.contact_phone || user.phone,
    });
    setUser({
      ...user,
      full_name: formData.company_name,
      phone: formData.contact_phone || user.phone,
    });

    setMessageType("success");
    setMessage("Company settings updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isSupabaseConfigured()) {
      if (password.new !== password.confirm) { setMessageType("error"); setMessage("New passwords do not match"); return; }
      if (password.new.length < 8) { setMessageType("error"); setMessage("Password must be at least 8 characters"); return; }
      const { error } = await createClient().auth.updateUser({ password: password.new });
      if (error) { setMessageType("error"); setMessage(error.message); return; }
      setPassword({ current: "", new: "", confirm: "" });
      setMessageType("success"); setMessage("Password changed successfully!");
      return;
    }

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

    const updated = updateUserPasswordByEmail(user.email, password.new);
    if (!updated) {
      setMessageType("error");
      setMessage("Unable to update password");
      return;
    }

    const updatedUser = { ...user, password: password.new };
    setCurrentUser(updatedUser);
    setUser(updatedUser);
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

      {user && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Company logo</h2>
          <ProfilePhotoEditor
            userId={user.id}
            table="company_profiles"
            field="logo_url"
            initialPath={logoPath}
            label="Change logo"
            alt="Company logo"
            shape="square"
            onSaved={setLogoPath}
          />
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
              <label className="block text-sm font-medium mb-2">
                Company Name
              </label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Type
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({ ...formData, business_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="travel">Travel Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={formData.trade_license_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trade_license_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                TIN Number
              </label>
              <input
                type="text"
                value={formData.tin_number}
                onChange={(e) =>
                  setFormData({ ...formData, tin_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub-city
                </label>
                <input
                  type="text"
                  value={formData.sub_city}
                  onChange={(e) =>
                    setFormData({ ...formData, sub_city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
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
            <h2 className="text-xl font-semibold">{isSupabaseConfigured() ? "Set or change password" : "Change Password"}</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {!isSupabaseConfigured() && <div className="relative">
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
            </div>}

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
