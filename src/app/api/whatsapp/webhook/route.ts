import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPlainWhatsApp } from "@/lib/whatsapp";

// Verificación inicial exigida por Meta al registrar el Webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
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

async function updateGoogleCalendarTag({
  clinic,
  googleEventId,
  originalName,
  tag,
}: {
  clinic: {
    id: string;
    google_calendar_id: string | null;
    google_access_token: string | null;
    google_refresh_token: string | null;
  };
  googleEventId: string;
  originalName: string;
  tag: "[CONFIRMADA]" | "[CANCELADA]";
}) {
  const admin = createAdminClient();
  let accessToken = clinic.google_access_token;
  if (!accessToken) return;

  const cleanTitle = originalName.replace(/^\[(CONFIRMADA|CANCELADA)\]\s*/i, "");
  const newSummary = `${tag} ${cleanTitle}`;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    clinic.google_calendar_id || "primary"
  )}/events/${encodeURIComponent(googleEventId)}`;

  let res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary: newSummary }),
  });

  if (res.status === 401 && clinic.google_refresh_token) {
    const newToken = await refreshGoogleToken(clinic.google_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await admin.from("clinics").update({ google_access_token: newToken }).eq("id", clinic.id);
      res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary: newSummary }),
      });
    }
  }
}

// Recibe las respuestas de los botones desde WhatsApp
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) {
      return NextResponse.json({ received: true });
    }

    const buttonId: string | undefined =
      message?.interactive?.button_reply?.id || message?.button?.payload;

    if (!buttonId || (!buttonId.startsWith("confirm_") && !buttonId.startsWith("cancel_"))) {
      return NextResponse.json({ received: true });
    }

    const isConfirm = buttonId.startsWith("confirm_");
    const appointmentId = buttonId.replace(/^(confirm_|cancel_)/, "");
    const newStatus = isConfirm ? "confirmed" : "cancelled";

    const admin = createAdminClient();
    const { data: appointment } = await admin
      .from("appointments")
      .select("*, clinics(*)")
      .eq("id", appointmentId)
      .single();

    if (!appointment || !appointment.clinics) {
      return NextResponse.json({ received: true });
    }

    const clinic = appointment.clinics;

    // 1. Actualiza el estado en Supabase
    await admin
      .from("appointments")
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    // 2. Marca la cita en Google Calendar como [CONFIRMADA] o [CANCELADA]
    await updateGoogleCalendarTag({
      clinic,
      googleEventId: appointment.google_event_id,
      originalName: appointment.patient_name,
      tag: isConfirm ? "[CONFIRMADA]" : "[CANCELADA]",
    });

    // 3. Responde al paciente por WhatsApp
    if (appointment.patient_phone) {
      const replyText = isConfirm
        ? `¡Perfecto! Tu cita en *${clinic.clinic_name}* queda confirmada. ¡Te esperamos!`
        : `Gracias por avisar con tiempo. Hemos notificado a *${clinic.clinic_name}* para liberar el hueco y ofrecerte otra fecha si lo necesitas.`;
      await sendPlainWhatsApp(appointment.patient_phone, replyText);
    }

    // 4. Si canceló, avisa inmediatamente a la clínica para rellenar el hueco
    if (!isConfirm && clinic.alert_phone) {
      const cleanAlertPhone = clinic.alert_phone.replace(/\D/g, "");
      if (cleanAlertPhone.length >= 9) {
        const formattedDate = new Date(appointment.start_time).toLocaleString("es-ES", {
          timeZone: "Europe/Madrid",
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        await sendPlainWhatsApp(
          cleanAlertPhone,
          `⚠️ Hueco libre en *${clinic.clinic_name}*: *${appointment.patient_name}* ha cancelado su cita del *${formattedDate}*. Ya puedes llamar a tu lista de espera.`
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error en webhook WhatsApp:", err);
    return NextResponse.json({ received: true });
  }
}