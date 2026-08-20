"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getEmployeeProfile,
  getCurrentUser,
  setCurrentUser,
  updateEmployeeProfile,
  updateUserPasswordByEmail,
} from "@/lib/local-storage";
import ProfilePhotoEditor from "@/components/profile-photo-editor";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function EmployeeSettings() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    desired_position: "",
    years_experience: "",
    highest_education: "",
    availability: "",
    preferred_cities: "",
    willing_to_relocate: false,
    expected_salary_min: "",
    expected_salary_max: "",
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
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }
    setUser(currentUser);
    const employeeProfile = getEmployeeProfile(currentUser.id);
    setAvatarPath(employeeProfile?.avatar_url || null);
    setFormData({
      full_name: employeeProfile?.full_name || currentUser.full_name || "",
      email: currentUser.email || "",
      phone: employeeProfile?.phone || currentUser.phone || "",
      desired_position: employeeProfile?.desired_position || "",
      years_experience: employeeProfile?.years_experience?.toString() || "",
      highest_education: (employeeProfile as any)?.highest_education || "",
      availability: (employeeProfile as any)?.availability || "",
      preferred_cities: employeeProfile?.preferred_cities || "",
      willing_to_relocate: Boolean(
        (employeeProfile as any)?.willing_to_relocate,
      ),
      expected_salary_min:
        employeeProfile?.expected_salary_min?.toString() || "",
      expected_salary_max:
        employeeProfile?.expected_salary_max?.toString() || "",
    });
    setLoading(false);
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const profileUpdates = {
      desired_position: formData.desired_position,
      years_experience: formData.years_experience
        ? Number(formData.years_experience)
        : undefined,
      highest_education: formData.highest_education,
      availability: formData.availability,
      preferred_cities: formData.preferred_cities,
      willing_to_relocate: formData.willing_to_relocate,
      expected_salary_min: formData.expected_salary_min
        ? Number(formData.expected_salary_min)
        : undefined,
      expected_salary_max: formData.expected_salary_max
        ? Number(formData.expected_salary_max)
        : undefined,
      full_name: formData.full_name,
      phone: formData.phone,
    };

    updateEmployeeProfile(user.id, profileUpdates as any);

    const updated = { ...user, ...profileUpdates };
    setCurrentUser(updated);
    setUser(updated);

    setMessageType("success");
    setMessage("Profile updated successfully!");
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
          Manage your account settings and preferences
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
          <h2 className="text-xl font-semibold mb-4">Profile photo</h2>
          <ProfilePhotoEditor
            userId={user.id}
            table="employee_profiles"
            field="avatar_url"
            initialPath={avatarPath}
            label="Change photo"
            alt="Profile photo"
            onSaved={setAvatarPath}
          />
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Profile Information</h2>
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

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Desired Position
              </label>
              <input
                type="text"
                value={formData.desired_position}
                onChange={(e) =>
                  setFormData({ ...formData, desired_position: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      years_experience: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Highest Education
                </label>
                <select
                  value={formData.highest_education}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      highest_education: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tvet">TVET</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="doctorate">Doctorate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Availability
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) =>
                    setFormData({ ...formData, availability: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select</option>
                  <option value="immediately">Immediately</option>
                  <option value="within_two_weeks">Within 2 weeks</option>
                  <option value="within_a_month">Within a month</option>
                  <option value="not_available">Not available</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Cities
                </label>
                <input
                  type="text"
                  value={formData.preferred_cities}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_cities: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Salary Min
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.expected_salary_min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_salary_min: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Salary Max
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.expected_salary_max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_salary_max: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.willing_to_relocate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    willing_to_relocate: e.target.checked,
                  })
                }
              />
              Willing to relocate
            </label>

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
