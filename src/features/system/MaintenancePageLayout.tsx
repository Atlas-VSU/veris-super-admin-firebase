"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ShieldAlert } from "lucide-react";

export default function MaintenancePageLayout() {
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center animate-fade-in"
      style={{
        background:
          "linear-gradient(to bottom, var(--background) 0%, var(--background) 65%, var(--accent-soft) 100%)",
      }}
    >
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
          {/* Mobile Image */}
          <div className="lg:hidden w-full flex justify-center items-center order-1 animate-page-enter">
            <div className="w-full max-w-[280px] flex justify-center">
              <Image
                src="/images/ussc-logo-lockup-black.webp"
                alt="Not Available Illustration"
                width={250}
                height={190}
                className="w-auto h-auto object-contain max-h-[200px] opacity-75"
                priority
              />
            </div>
          </div>

          {/* Left Column - Content */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left">
            <div className="mb-6">
              <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive mb-4">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-ink leading-tight mb-3">
                Under Maintenance
              </h1>
              <p className="font-sans text-lg sm:text-xl text-ink-muted leading-relaxed">
                This page is currently undergoing maintenance. Please try again later.
              </p>
            </div>
          </div>

          {/* Right Column - Illustration (Desktop) */}
          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-page-enter">
            <div className="w-full max-w-[400px] flex justify-center">
              <Image
                src="/images/foc-logo.png"
                alt="Not Available Illustration"
                width={380}
                height={280}
                className="w-auto h-auto object-contain max-h-[320px] opacity-75"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
