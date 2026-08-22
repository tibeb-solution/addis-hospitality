"use client";

import type { User } from "@supabase/supabase-js";
import { LocalUser, setCurrentUser } from "@/lib/local-storage";

type SupabaseClientLike = {
  from: (table: string) => any;
};

export async function syncAuthenticatedUser(
  authUser: User,
  supabase: SupabaseClientLike,
  preferredRole?: "employee" | "company" | "admin",
): Promise<LocalUser> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const metadata = authUser.user_metadata ?? {};
  const role = (profile?.role ?? metadata.role ?? preferredRole ?? "employee") as LocalUser["role"];
  const fullName =
    profile?.full_name ??
    metadata.full_name ??
    metadata.name ??
    authUser.email?.split("@")[0] ??
    "";

  if (!profile) {
    await supabase.from("profiles").upsert({
      id: authUser.id,
      auth_user_id: authUser.id,
      email: authUser.email ?? "",
      role,
      full_name: fullName,
      phone: metadata.phone ?? "",
      status: "active",
      email_verified: true,
    });
  }

  const localUser: LocalUser = {
    id: authUser.id,
    email: authUser.email ?? "",
    password: "",
    role,
    full_name: fullName,
    phone: profile?.phone ?? metadata.phone ?? "",
    status: (profile?.status ?? "active") as LocalUser["status"],
    email_verified: true,
    created_at: profile?.created_at ?? authUser.created_at,
  };

  setCurrentUser(localUser);
  return localUser;
}