import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import TelegramTokenHandler from "@/components/auth/TelegramTokenHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: "AiCrypto Bot - Investment Platform",
  description: "Secure investment platform with automated returns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <ReduxProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <TelegramTokenHandler />
            </Suspense>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
