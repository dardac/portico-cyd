import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_NAME, BUILDING_NAME, BUILDING_SUBTITLE } from "@/lib/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${BUILDING_NAME}`,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_NAME}: gestión de residentes y comisiones de reparación del edificio ${BUILDING_NAME}, ${BUILDING_SUBTITLE}.`,
  applicationName: APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-stone-900">
        {children}
      </body>
    </html>
  );
}
