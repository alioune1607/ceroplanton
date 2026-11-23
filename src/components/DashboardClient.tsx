"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Clinic {
  id: string;
  clinic_name: string;
  alert_phone: string | null;
  reminder_hours_before: number;
  is_active: boolean;
}

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string | null;
  start_time: string;
  status: "pending" | "reminded" | "confirmed" | "cancelled" | "no_phone";
}

const STATUS_BADGE: Record<Appointment["status"], { label: string; className: string }> = {
  pending: { label: "Pendiente de envío", className: "bg-slate-100 text-slate-700" },
  reminded: { label: "WhatsApp enviado", className: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmada", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelada", className: "bg-rose-100 text-rose-700" },
  no_phone: { label: "Sin teléfono", className: "bg-amber-100 text-amber-800" },
};

export default function DashboardClient({
  userEmail,
  initialClinic,
  initialAppointments,
}: {
  userEmail: string;
  initialClinic: Clinic;
  initialAppointments: Appointment[];
}) {
  const router = useRouter();
  const [clinicName, setClinicName] = useState(initialClinic.clinic_name);
  const [alertPhone, setAlertPhone] = useState(initialClinic.alert_phone || "");
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data.error}`);
      } else {
        setAppointments(data.appointments);
        setMessage(`Sincronización completada: ${data.synced} citas revisadas de los próximos 7 días.`);
      }
    } catch {
      setMessage("Error de conexión al sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSendWhatsApp(appointmentId: string) {
    setSendingId(appointmentId);
    setMessage(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error WhatsApp: ${data.error}`);
      } else {
        setAppointments((prev) =>
          prev.map((item) => (item.id === appointmentId ? data.appointment : item))
        );
        setMessage("¡WhatsApp enviado correctamente! Mira tu móvil.");
      }
    } catch {
      setMessage("Error de conexión enviando el recordatorio.");
    } finally {
      setSendingId(null);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("clinics")
      .update({ clinic_name: clinicName, alert_phone: alertPhone })
      .eq("id", initialClinic.id);

    setSaving(false);
    setMessage(error ? "Error guardando ajustes." : "Ajustes de tu clínica guardados.");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              CP
            </span>
            <span className="font-bold text-slate-900">CeroPlantón</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-500 sm:inline">{userEmail}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Datos de tu clínica</h2>
          <p className="mt-1 text-xs text-slate-500">
            Este nombre aparecerá en los recordatorios de WhatsApp que reciban tus pacientes.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Nombre de la clínica"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <input
              type="text"
              value={alertPhone}
              onChange={(e) => setAlertPhone(e.target.value)}
              placeholder="Tu WhatsApp para alertas (ej. 34600123456)"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar datos"}
            </button>
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Próximas citas (7 días)</h1>
            <p className="text-xs text-slate-500">
              Consejo: incluye el móvil del paciente en el título o descripción de la cita en Google
              Calendar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Google Calendar"}
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {appointments.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aún no hay citas cargadas
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Crea una cita de prueba mañana en tu Google Calendar (ej.{" "}
                <strong>&quot;Prueba Carlos 612345678&quot;</strong>) y pulsa el botón verde de
                arriba.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => {
                const badge = STATUS_BADGE[appt.status];
                const formattedDate = new Date(appt.start_time).toLocaleString("es-ES", {
                  timeZone: "Europe/Madrid",
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={appt.id}
                    className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{appt.patient_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          {appt.patient_phone ? (
                            <>
                              <Phone className="h-3.5 w-3.5 text-emerald-600" /> +
                              {appt.patient_phone}
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Añade un
                              móvil en la cita
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {appt.status === "confirmed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {badge.label}
                      </span>

                      {appt.patient_phone && appt.status !== "confirmed" && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(appt.id)}
                          disabled={sendingId === appt.id}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sendingId === appt.id ? "Enviando..." : "Enviar WhatsApp"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}