import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.session.user;
  const providerToken = data.session.provider_token;
  const providerRefreshToken = data.session.provider_refresh_token;

  // Comprobamos si la clínica ya existe para no borrar un refresh_token previo
  const { data: existingClinic } = await supabase
    .from("clinics")
    .select("id, google_refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  const clinicPayload: Record<string, string | null> = {
    user_id: user.id,
    clinic_name: user.user_metadata?.full_name
      ? `Clínica de ${user.user_metadata.full_name}`
      : "Mi Clínica",
  };

  if (providerToken) {
    clinicPayload.google_access_token = providerToken;
  }
  if (providerRefreshToken) {
    clinicPayload.google_refresh_token = providerRefreshToken;
  }

  if (existingClinic) {
    await supabase
      .from("clinics")
      .update({
        ...(providerToken ? { google_access_token: providerToken } : {}),
        ...(providerRefreshToken ? { google_refresh_token: providerRefreshToken } : {}),
      })
      .eq("id", existingClinic.id);
  } else {
    await supabase.from("clinics").insert(clinicPayload);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}