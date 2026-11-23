const GRAPH_VERSION = "v22.0";

function getWhatsAppConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID en .env.local");
  }

  return { token, phoneNumberId };
}

export async function sendAppointmentReminder({
  to,
  clinicName,
  appointmentId,
  startTimeIso,
}: {
  to: string;
  clinicName: string;
  appointmentId: string;
  startTimeIso: string;
}) {
  const { token, phoneNumberId } = getWhatsAppConfig();

  const dateText = new Date(startTimeIso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `Hola 👋 Te recordamos tu cita en *${clinicName}* el *${dateText}*.\n\nPor favor, pulsa una opción para confirmar o avisar si no puedes asistir:`,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: `confirm_${appointmentId}`,
                  title: "Confirmar cita",
                },
              },
              {
                type: "reply",
                reply: {
                  id: `cancel_${appointmentId}`,
                  title: "Cancelar cita",
                },
              },
            ],
          },
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Error enviando WhatsApp en Meta");
  }

  return data.messages?.[0]?.id as string | undefined;
}

export async function sendPlainWhatsApp(to: string, text: string) {
  const { token, phoneNumberId } = getWhatsAppConfig();

  await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}