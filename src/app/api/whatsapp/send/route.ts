import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentReminder } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { appointmentId } = (await request.json()) as { appointmentId?: string };
  if (!appointmentId) {
    return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("id, clinic_name")
    .eq("user_id", user.id)
    .single();

  if (!clinic) {
    return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("clinic_id", clinic.id)
    .single();

  if (!appointment || !appointment.patient_phone) {
    return NextResponse.json(
      { error: "La cita no existe o no tiene número de teléfono" },
      { status: 400 }
    );
  }

  try {
    const messageId = await sendAppointmentReminder({
      to: appointment.patient_phone,
      clinicName: clinic.clinic_name,
      appointmentId: appointment.id,
      startTimeIso: appointment.start_time,
    });

    const { data: updated } = await supabase
      .from("appointments")
      .update({
        status: "reminded",
        whatsapp_message_id: messageId || null,
        reminded_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .select()
      .single();

    return NextResponse.json({ ok: true, appointment: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error enviando WhatsApp";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}