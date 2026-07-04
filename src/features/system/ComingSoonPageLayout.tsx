"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, ArrowLeft, Clock, Wrench } from "lucide-react";

export default function ComingSoonPageLayout() {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && canGoBack) {
      window.history.back();
    }
  };

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
              <div className="w-[240px] h-[180px] bg-primary/10 rounded-2xl flex items-center justify-center">
                <Wrench className="w-16 h-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Left Column - Content */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left">
            <div className="mb-6">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <Clock className="w-10 h-10 text-primary animate-pulse" />
                <div className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-none">
                  Coming Soon
                </div>
              </div>
              <p className="font-sans text-lg sm:text-xl text-ink-muted leading-relaxed">
                We're working hard to bring you this feature. Stay tuned for updates!
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 w-full max-w-[480px] mx-auto lg:mx-0 shadow-sm">
              <div className="space-y-4">
                <h2 className="font-sans font-semibold text-lg text-ink mb-4">
                  What would you like to do?
                </h2>

                {/* Go to Homepage */}
                <Link
                  href="/"
                  className="w-full h-[48px] bg-primary text-primary-foreground font-sans font-medium text-[15px] rounded-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 group"
                >
                  <Home className="h-4.5 w-4.5 group-hover:scale-105 transition-transform" />
                  Go to Homepage
                </Link>

                {/* Go Back Button */}
                <button
                  onClick={handleGoBack}
                  disabled={!canGoBack}
                  className="w-full h-[48px] border border-rule-strong bg-paper text-ink font-sans font-medium text-[15px] rounded-md hover:bg-paper-2 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4.5 w-4.5 group-hover:scale-105 transition-transform" />
                  Go Back
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration (Desktop) */}
          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-page-enter">
            <div className="w-full max-w-[450px] flex justify-center">
              <div className="w-[380px] h-[280px] bg-primary/5 rounded-3xl flex items-center justify-center relative overflow-hidden border border-border">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-16 h-16 border-2 border-primary rounded-full animate-pulse"></div>
                  <div className="absolute top-20 right-16 w-8 h-8 bg-primary rounded-full animate-bounce animation-delay-300"></div>
                  <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-primary rounded-lg animate-pulse animation-delay-600"></div>
                  <div className="absolute bottom-16 right-12 w-6 h-6 bg-primary rounded-full animate-bounce animation-delay-900"></div>
                </div>

                {/* Main icon */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <Wrench className="w-24 h-24 text-primary animate-pulse" />
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
