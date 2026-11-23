import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

// Busca un móvil español (6XX / 7XX) o internacional (+34...) en título o descripción
function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\d{9,12})/);
  if (!match) return null;

  const digits = match[0].replace(/\D/g, "");
  if (digits.length === 9 && /^[6789]/.test(digits)) {
    return `34${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!clinic) {
    return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });
  }

  let accessToken: string | null = clinic.google_access_token;

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const calendarUrl = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      clinic.google_calendar_id || "primary"
    )}/events`
  );
  calendarUrl.searchParams.set("timeMin", now.toISOString());
  calendarUrl.searchParams.set("timeMax", nextWeek.toISOString());
  calendarUrl.searchParams.set("singleEvents", "true");
  calendarUrl.searchParams.set("orderBy", "startTime");

  let googleRes = await fetch(calendarUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Si el token expiró (401), lo renovamos automáticamente con refresh_token
  if (googleRes.status === 401 && clinic.google_refresh_token) {
    const newToken = await refreshGoogleAccessToken(clinic.google_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("clinics")
        .update({ google_access_token: newToken })
        .eq("id", clinic.id);

      googleRes = await fetch(calendarUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }

  if (!googleRes.ok) {
    return NextResponse.json(
      { error: "Error leyendo Google Calendar. Vuelve a iniciar sesión." },
      { status: 400 }
    );
  }

  const googleData = await googleRes.json();
  const events: GoogleCalendarEvent[] = googleData.items || [];

  let syncedCount = 0;

  for (const ev of events) {
    if (ev.status === "cancelled" || !ev.start?.dateTime) continue;

    const summary = ev.summary || "Cita sin título";
    const fullText = `${summary} ${ev.description || ""}`;
    const phone = extractPhone(fullText);

    // Comprobamos si ya existe para no pisar estados confirmed/cancelled/reminded
    const { data: existing } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("clinic_id", clinic.id)
      .eq("google_event_id", ev.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("appointments")
        .update({
          patient_name: summary,
          patient_phone: phone,
          start_time: ev.start.dateTime,
          ...(existing.status === "no_phone" && phone ? { status: "pending" } : {}),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("appointments").insert({
        clinic_id: clinic.id,
        google_event_id: ev.id,
        patient_name: summary,
        patient_phone: phone,
        start_time: ev.start.dateTime,
        status: phone ? "pending" : "no_phone",
      });
    }

    syncedCount++;
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinic.id)
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true });

  return NextResponse.json({
    synced: syncedCount,
    appointments: appointments || [],
  });
}