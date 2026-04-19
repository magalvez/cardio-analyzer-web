import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAPA Cardio — Web App",
  description: "Plataforma de gestión y análisis de estudios MAPA cardiológicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans min-h-full flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
