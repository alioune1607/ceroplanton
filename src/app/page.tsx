"use client";

import { useState, type FormEvent } from "react";

const WEB3FORMS_KEY = "0eb108c7-d3a8-4ed1-a1f5-c7f2e7da993a";

export default function Home() {
  // Estado de la demo interactiva de WhatsApp
  const [chatState, setChatState] = useState<"pending" | "confirmed" | "cancelled">("pending");

  // Estado de la calculadora de plantones
  const [precioSesion, setPrecioSesion] = useState<number>(45);
  const [plantonesMes, setPlantonesMes] = useState<number>(6);

  // Estado del formulario
  const [clinica, setClinica] = useState("");
  const [sector, setSector] = useState("Fisioterapia");
  const [contacto, setContacto] = useState("");
  const [usaCalendar, setUsaCalendar] = useState("Sí, uso Google Calendar");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const perdidaMensual = precioSesion * plantonesMes;
  const perdidaAnual = perdidaMensual * 12;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Nuevo lead Plan Fundador - ${clinica}`,
          from_name: "CeroPlantón Web",
          clinica,
          sector,
          contacto,
          usaCalendar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setClinica("");
        setContacto("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Barra superior */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              CP
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CeroPlantón
            </span>
          </div>
          <a
            href="#plan-fundador"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Probar 14 días gratis
          </a>
        </div>
      </header>

      {/* Hero + Demo interactiva */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Acceso Fundador · Quedan 10 plazas para clínicas
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Reduce tus citas perdidas hasta un 70 % con recordatorios por WhatsApp
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Conecta tu <strong>Google Calendar</strong> una sola vez. 24 horas antes de cada cita,
            tu paciente recibe un WhatsApp automático para confirmar o avisar si no puede ir, sin
            que tú tengas que escribir a nadie a mano.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#plan-fundador"
              className="rounded-xl bg-emerald-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Quiero el Plan Fundador (15 €/mes)
            </a>
            <a
              href="#como-funciona"
              className="rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            14 días de prueba gratis · Sin tarjeta · Configuración en 2 minutos
          </p>
        </div>

        {/* Simulador interactivo de WhatsApp */}
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-lg">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#efeae2]">
            {/* Cabecera WhatsApp */}
            <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Clínica FisioSalud</p>
                <p className="text-[11px] text-emerald-100">Recordatorio automático</p>
              </div>
              <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px]">
                Demo real
              </span>
            </div>

            {/* Mensajes */}
            <div className="space-y-3 p-4 text-sm">
              <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white p-3 text-slate-800 shadow-sm">
                <p>
                  Hola <strong>Laura</strong> 👋 Te recordamos tu cita mañana{" "}
                  <strong>martes a las 17:30</strong> en Clínica FisioSalud.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Pulsa una opción para avisarnos en 1 segundo:
                </p>
                <p className="mt-1 text-right text-[10px] text-slate-400">17:30</p>
              </div>

              {chatState === "pending" && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setChatState("confirmed")}
                    className="w-full cursor-pointer rounded-xl bg-white py-2.5 text-center text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                  >
                    ✅ Sí, confirmo asistencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatState("cancelled")}
                    className="w-full cursor-pointer rounded-xl bg-white py-2.5 text-center text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-50"
                  >
                    ❌ No puedo asistir / Cambiar cita
                  </button>
                </div>
              )}

              {chatState === "confirmed" && (
                <>
                  <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-none bg-[#d9fdd3] p-2.5 text-slate-800 shadow-sm">
                    ✅ Sí, confirmo asistencia
                  </div>
                  <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white p-3 text-slate-800 shadow-sm">
                    ¡Perfecto, Laura! Tu cita queda confirmada. ¡Te esperamos mañana!
                    <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-[11px] font-medium text-emerald-800">
                      📅 Tu Google Calendar se marca automáticamente como [CONFIRMADA]
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatState("pending")}
                    className="w-full cursor-pointer text-center text-xs font-medium text-slate-500 underline"
                  >
                    Probar otra opción
                  </button>
                </>
              )}

              {chatState === "cancelled" && (
                <>
                  <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-none bg-[#d9fdd3] p-2.5 text-slate-800 shadow-sm">
                    ❌ No puedo asistir / Cambiar cita
                  </div>
                  <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white p-3 text-slate-800 shadow-sm">
                    Gracias por avisar con tiempo, Laura. Te escribimos enseguida para darte otro
                    hueco.
                    <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-medium text-amber-800">
                      🔔 Recibes alerta inmediata para rellenar ese hueco de las 17:30 y no perder
                      el dinero
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatState("pending")}
                    className="w-full cursor-pointer text-center text-xs font-medium text-slate-500 underline"
                  >
                    Probar otra opción
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            👆 Pulsa los botones de arriba para probar cómo lo ve tu paciente
          </p>
        </div>
      </section>

      {/* Calculadora de dinero perdido */}
      <section className="border-y border-slate-100 bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
              ¿Cuánto dinero te cuestan los plantones al año?
            </h2>
            <p className="mt-1 text-center text-sm text-slate-500">
              Ajusta tus números reales para verlo al instante
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Precio medio de tu sesión</span>
                  <span className="font-bold text-emerald-700">{precioSesion} €</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={150}
                  step={5}
                  value={precioSesion}
                  onChange={(e) => setPrecioSesion(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Citas perdidas o canceladas tarde al mes</span>
                  <span className="font-bold text-emerald-700">{plantonesMes} citas</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={plantonesMes}
                  onChange={(e) => setPlantonesMes(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-600"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 rounded-xl bg-slate-900 p-5 text-white sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Pierdes cada mes
                </p>
                <p className="mt-1 text-3xl font-extrabold text-rose-400">
                  {perdidaMensual.toLocaleString("es-ES")} €
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Pierdes al año en huecos vacíos
                </p>
                <p className="mt-1 text-3xl font-extrabold text-white">
                  {perdidaAnual.toLocaleString("es-ES")} €
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              Con evitar <strong>un solo plantón al mes</strong>, CeroPlantón ya se paga solo el
              triple.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Funciona en piloto automático en 3 pasos
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Conecta tu Google Calendar",
              desc: "Sigues apuntando tus citas exactamente igual que ahora, sin cambiar de programa ni aprender software complejo.",
            },
            {
              step: "2",
              title: "WhatsApp 24 h antes",
              desc: "El sistema detecta el teléfono en tu cita y envía un WhatsApp limpio con fecha, hora y botones de confirmación.",
            },
            {
              step: "3",
              title: "Rellena huecos a tiempo",
              desc: "Si un paciente cancela, te avisamos al momento para que llames a otro cliente de tu lista de espera.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precio + Formulario Plan Fundador */}
      <section id="plan-fundador" className="border-t border-slate-100 bg-emerald-50/50 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-2 md:items-start">
          {/* Tarjeta oferta */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Oferta de lanzamiento · Solo 10 clínicas
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Plan Fundador</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">15 €</span>
              <span className="text-sm text-slate-500">/mes para siempre</span>
              <span className="ml-2 text-sm text-slate-400 line-through">29 €/mes</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Empieza con <strong>14 días gratis sin tarjeta</strong>. Si no te ahorra plantones,
              no pagas nada.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>✅ Hasta 250 recordatorios de WhatsApp al mes</li>
              <li>✅ Conexión directa con Google Calendar</li>
              <li>✅ Alertas instantáneas de cancelaciones</li>
              <li>✅ Te lo dejamos configurado por WhatsApp en 10 min</li>
              <li>✅ Sin permanencia: cancelas cuando quieras</li>
            </ul>
          </div>

          {/* Formulario */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-bold text-slate-900">
              Reserva tu prueba gratis de 14 días
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Déjanos tus datos y te contactamos para activar tu plaza del Plan Fundador.
            </p>

            {status === "success" ? (
              <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-emerald-900 ring-1 ring-emerald-200">
                <p className="font-bold">¡Plaza pre-reservada correctamente!</p>
                <p className="mt-1 text-sm">
                  Te escribiremos muy pronto para activar tus 14 días gratis y dejarlo conectado
                  con tu agenda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Nombre de tu clínica o centro
                  </label>
                  <input
                    type="text"
                    required
                    value={clinica}
                    onChange={(e) => setClinica(e.target.value)}
                    placeholder="Ej. Fisioterapia Alameda"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Estética / Belleza">Estética / Belleza</option>
                    <option value="Psicología">Psicología</option>
                    <option value="Podología / Dentista">Podología / Dentista</option>
                    <option value="Entrenador / Nutrición">Entrenador / Nutrición</option>
                    <option value="Otro">Otro tipo de citas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    WhatsApp o Email de contacto
                  </label>
                  <input
                    type="text"
                    required
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Ej. 600 123 456 o info@tuclinica.es"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    ¿Dónde apuntas tus citas ahora?
                  </label>
                  <select
                    value={usaCalendar}
                    onChange={(e) => setUsaCalendar(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Sí, uso Google Calendar">Google Calendar</option>
                    <option value="Otro software de clínica">Otro programa de citas</option>
                    <option value="Agenda en papel / WhatsApp">Agenda en papel / a mano</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {status === "loading" ? "Enviando..." : "Solicitar acceso gratis 14 días"}
                </button>

                {status === "error" && (
                  <p className="text-center text-xs text-rose-600">
                    Hubo un error al enviar. Revisa tu conexión o inténtalo de nuevo.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-500">
        © 2026 CeroPlantón · Recordatorios automáticos por WhatsApp para clínicas independientes
      </footer>
    </div>
  );
}