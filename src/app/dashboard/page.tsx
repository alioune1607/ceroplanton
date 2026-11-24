import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!clinic) {
    redirect("/login");
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinic.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  return (
    <DashboardClient
      userEmail={user.email || ""}
      initialClinic={clinic}
      initialAppointments={appointments || []}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Cargando tu panel de CeroPlantón...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}