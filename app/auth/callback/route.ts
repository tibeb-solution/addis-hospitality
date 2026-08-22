import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role");

  const supabase = await createClient();
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (role === "employee" || role === "company") {
    if (user) {
      await supabase.from("profiles").update({ role }).eq("id", user.id);
      if (role === "company") {
        await supabase.from("employee_profiles").delete().eq("id", user.id);
        await supabase.from("company_profiles").upsert({
          id: user.id,
          company_name: user.user_metadata?.name || "",
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
