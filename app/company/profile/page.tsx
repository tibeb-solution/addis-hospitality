"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import AvatarCropper from "@/components/avatar-cropper";

const BUSINESS_TYPES = [
  "restaurant",
  "cafe",
];

export default function CompanyProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      // Load company profile
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Create if doesn't exist
      if (!data) {
        const { data: created } = await supabase
          .from("company_profiles")
          .insert([{ id: user.id }])
          .select()
          .single();

        setProfile(created || { id: user.id });
      } else {
        setProfile(data);
        if (data.logo_url) {
          const { data: signedUrl } = await supabase.storage
            .from("avatars")
            .getPublicUrl(data.logo_url);
          setLogoUrl(signedUrl.publicUrl);
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImage(url);
  };

  const handleCropCancel = () => {
    setCropImage(null);
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const previewUrl = URL.createObjectURL(blob);
      setLogoUrl(previewUrl);

      const uploadFile = new File([blob], `${user.id}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const supabase = createClient();
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("company_profiles")
        .update({ logo_url: fileName })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      setCropImage(null);
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const formData = new FormData(e.currentTarget);

      const updates: any = {
        id: user.id,
        company_name: formData.get("company_name"),
        business_type: formData.get("business_type"),
        trade_license_number: formData.get("trade_license_number"),
        tin_number: formData.get("tin_number"),
        year_established: formData.get("year_established"),
        employee_count: formData.get("employee_count"),
        description: formData.get("description"),
        contact_person: formData.get("contact_person"),
        contact_position: formData.get("contact_position"),
        contact_phone: formData.get("contact_phone"),
        contact_email: formData.get("contact_email"),
        website: formData.get("website"),
        region: formData.get("region"),
        sub_city: formData.get("sub_city"),
        address: formData.get("address"),
      };

      const { error: updateError } = await supabase
        .from("company_profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, ...updates });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.serverError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("company.title")}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
        {/* Logo Section */}
        <div className="bg-card border border-border rounded-lg p-3 sm:p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-semibold">
            {t("company.logo")}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {logoUrl && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="object-cover w-20 h-20 sm:w-24 sm:h-24"
                />
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={saving}
                className="hidden"
              />
              <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                {t("company.logo")}
              </span>
            </label>
          </div>
          {cropImage && (
            <AvatarCropper
              imageSrc={cropImage}
              onCancel={handleCropCancel}
              onComplete={handleCropComplete}
            />
          )}
        </div>

        {/* Basic Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("company.basicInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.companyName")}
              </label>
              <input
                name="company_name"
                defaultValue={profile?.company_name}
                placeholder={t("auth.companyName")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.businessType")}
              </label>
              <select
                name="business_type"
                defaultValue={profile?.business_type}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">{t("auth.selectBusinessType")}</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`taxonomy.business_${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("company.description")}
            </label>
            <textarea
              name="description"
              defaultValue={profile?.description}
              placeholder={t("company.description")}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Legal Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("company.legalInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.tradeLicenseNumber")}
              </label>
              <input
                name="trade_license_number"
                defaultValue={profile?.trade_license_number}
                placeholder={t("company.tradeLicenseNumber")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.tinNumber")}
              </label>
              <input
                name="tin_number"
                defaultValue={profile?.tin_number}
                placeholder={t("company.tinNumber")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.yearEstablished")}
              </label>
              <input
                name="year_established"
                type="number"
                defaultValue={profile?.year_established}
                placeholder="2020"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.employeeCount")}
              </label>
              <input
                name="employee_count"
                type="number"
                defaultValue={profile?.employee_count}
                placeholder="100"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("company.contactInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.contactPerson")}
              </label>
              <input
                name="contact_person"
                defaultValue={profile?.contact_person}
                placeholder={t("company.contactPerson")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.contactPosition")}
              </label>
              <input
                name="contact_position"
                defaultValue={profile?.contact_position}
                placeholder={t("company.contactPosition")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.contactPhone")}
              </label>
              <input
                name="contact_phone"
                type="tel"
                defaultValue={profile?.contact_phone}
                placeholder="+251..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.contactEmail")}
              </label>
              <input
                name="contact_email"
                type="email"
                defaultValue={profile?.contact_email}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("company.website")}
            </label>
            <input
              name="website"
              type="url"
              defaultValue={profile?.website}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Location Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">{t("company.contactInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.region")}
              </label>
              <input
                name="region"
                defaultValue={profile?.region}
                placeholder={t("company.region")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.subCity")}
              </label>
              <input
                name="sub_city"
                defaultValue={profile?.sub_city}
                placeholder={t("company.subCity")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("company.address")}
              </label>
              <input
                name="address"
                defaultValue={profile?.address}
                placeholder={t("company.address")}
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
    </div>
  );
}
