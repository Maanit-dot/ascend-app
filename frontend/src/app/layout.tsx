import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/components/layout/AppProviders";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "ASCEND — Become Who You're Training To Be",
    template: "%s · ASCEND",
  },
  description:
    "ASCEND turns studying, training, and discipline into a persistent RPG progression system. AI-adaptive quests, weekly bosses, and a character sheet for real life.",
  manifest: "/manifest.json",
  applicationName: "ASCEND",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASCEND",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-void">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
