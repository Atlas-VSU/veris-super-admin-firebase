"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPageLayout() {
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
              <Image
                src="/images/404-img.png"
                alt="404 Illustration"
                width={250}
                height={190}
                className="w-auto h-auto object-contain max-h-[200px]"
                priority
              />
            </div>
          </div>

          {/* Left Column - Content */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left">
            <div className="mb-6">
              <div className="font-serif text-8xl sm:text-9xl lg:text-[120px] font-bold text-primary leading-none mb-2 select-none">
                404
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-ink leading-tight mb-3">
                Page Not Found
              </h1>
              <p className="font-sans text-lg sm:text-xl text-ink-muted leading-relaxed">
                The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 w-full max-w-[480px] mx-auto lg:mx-0 shadow-sm">
              <div className="space-y-4">
                <h2 className="font-sans font-semibold text-lg text-ink mb-4">
                  What would you like to do?
                </h2>

                {/* Go Home Button */}
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
            <div className="w-full max-w-[500px] flex justify-center">
              <Image
                src="/images/404-img.png"
                alt="404 Illustration"
                width={450}
                height={340}
                className="w-auto h-auto object-contain max-h-[360px]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
