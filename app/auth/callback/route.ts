import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const requestedNext = safeNext(searchParams.get("next"));
  const requestedRole = searchParams.get("role");
  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent("Authentication failed")}`);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/auth/login`);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  // The selected role is only used to initialize a brand-new account. It can
  // never overwrite an existing role, especially an admin role.
  const isPendingCompanyProfile = requestedRole === "company" &&
    existingProfile?.role === "employee" &&
    existingProfile.status === "pending";
  const isNewProfile = !existingProfile || isPendingCompanyProfile;
  const role = isNewProfile && (requestedRole === "employee" || requestedRole === "company")
    ? requestedRole
    : existingProfile?.role === "company" || existingProfile?.role === "admin"
      ? existingProfile.role
      : "employee";

  if (isNewProfile) {
    const profilePayload = {
      id: user.id,
      auth_user_id: user.id,
      email: user.email ?? "",
      role,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
      status: "active",
      email_verified: true,
    };
    const { error } = existingProfile
      ? await supabase.from("profiles").update(profilePayload).eq("id", user.id)
      : await supabase.from("profiles").insert(profilePayload);
    if (error) return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent("Unable to create profile")}`);

    if (role === "company") {
      const { error: companyProfileError } = await supabase.from("company_profiles").upsert({
        id: user.id,
        company_name: user.user_metadata?.name ?? "",
      });
      if (companyProfileError) return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent("Unable to create company profile")}`);
    } else {
      const { error: employeeProfileError } = await supabase.from("employee_profiles").upsert({ id: user.id });
      if (employeeProfileError) return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent("Unable to create employee profile")}`);
    }
  }

  const destination = requestedNext ?? (role === "admin" ? "/admin" : role === "company" ? "/company" : "/employee");
  return NextResponse.redirect(`${origin}${destination}`);
}
