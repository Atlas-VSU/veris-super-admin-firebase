"use client";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

// Generic-VERIS design system typography:
//   Geist      — UI body text
//   Geist Mono — monospace eyebrows, labels, data
//   Fraunces   — editorial serif headlines & stat values
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>VERIS Super Admin</title>
        <meta
          name="description"
          content="Your platform for modern productivity and collaboration"
        />
        <link rel="icon" href="/images/foc-logo.png" />
        <link rel="apple-touch-icon" href="/images/foc-logo.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="var(--primary)"
          shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
          showSpinner={false}
        />
        <div suppressHydrationWarning style={{ display: "contents" }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
          <Toaster position="top-right" expand={false} richColors closeButton />
        </div>
      </body>
    </html>
  );
}
