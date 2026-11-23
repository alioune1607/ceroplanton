"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar.events",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("No se pudo iniciar sesión con Google. Revisa la configuración.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            CP
          </span>
          <span className="text-xl font-bold text-slate-900">CeroPlantón</span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
          Conecta tu agenda
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Inicia sesión con la cuenta de Google donde apuntas las citas de tu clínica para activar
          los recordatorios por WhatsApp.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Conectando con Google..." : "Continuar con Google Calendar"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-center text-xs text-rose-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Solo pedimos acceso a los eventos de tu calendario para leer citas y marcar las
          confirmaciones.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-medium text-emerald-700 hover:underline">
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}