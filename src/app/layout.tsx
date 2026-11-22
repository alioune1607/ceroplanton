import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CeroPlantón | Recordatorios automáticos por WhatsApp para clínicas",
  description:
    "Conecta tu Google Calendar en 2 minutos y reduce tus citas perdidas hasta un 70 % con recordatorios automáticos por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased bg-white text-slate-900">{children}</body>
    </html>
  );
}