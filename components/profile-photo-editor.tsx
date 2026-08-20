"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AvatarCropper from "@/components/avatar-cropper";

interface ProfilePhotoEditorProps {
  userId: string;
  table: "employee_profiles" | "company_profiles";
  field: "avatar_url" | "logo_url";
  initialPath?: string | null;
  label: string;
  alt: string;
  shape?: "circle" | "square";
  onSaved?: (path: string) => void;
}

export default function ProfilePhotoEditor({
  userId,
  table,
  field,
  initialPath,
  label,
  alt,
  shape = "circle",
  onSaved,
}: ProfilePhotoEditorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPath) {
      setImageUrl(null);
      return;
    }

    const supabase = createClient();
    const { data } = supabase.storage.from("avatars").getPublicUrl(initialPath);
    setImageUrl(data.publicUrl || null);
  }, [initialPath]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setCropImage(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleCancel = () => {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);
  };

  const handleComplete = async (blob: Blob) => {
    setSaving(true);
    setError(null);

    try {
      const previewUrl = URL.createObjectURL(blob);
      const fileName = `${userId}/${Date.now()}.jpg`;
      const uploadFile = new File([blob], `${userId}.jpg`, {
        type: "image/jpeg",
      });
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, uploadFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { data: existingProfile } = await supabase
        .from(table)
        .select("id")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ [field]: fileName })
          .eq("id", userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from(table)
          .insert([{ id: userId, [field]: fileName }]);
        if (insertError) throw insertError;
      }

      setImageUrl(data.publicUrl || previewUrl);
      onSaved?.(fileName);
      handleCancel();
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save photo");
    } finally {
      setSaving(false);
    }
  };

  const imageClass =
    shape === "circle"
      ? "h-20 w-20 rounded-full object-cover"
      : "h-20 w-20 rounded-lg object-cover";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt={alt} className={imageClass} />
        ) : (
          <div
            className={`${imageClass} flex items-center justify-center bg-muted text-xs text-muted-foreground`}
          >
            {alt}
          </div>
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={saving}
            className="hidden"
          />
          <span className="inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            {saving ? "Saving..." : label}
          </span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {cropImage && (
        <AvatarCropper
          imageSrc={cropImage}
          onCancel={handleCancel}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
