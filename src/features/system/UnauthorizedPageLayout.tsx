"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, LogOut, Home } from "lucide-react";
import { auth } from "@/firebase/firebase.config";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cacheUtils } from "@/utils/cacheUtils";

export default function UnauthorizedPageLayout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      // Clear cookies/cache
      cacheUtils.setSigningOut(true);
      await auth.signOut();
      
      // Clear session cookies by making a request or clearing client storage
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      
      // Navigate to login with logout parameter
      router.push("/login?logout=true");
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setIsLoggingOut(false);
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
                src="/images/ussc-logo-lockup-black.webp"
                alt="Unauthorized Illustration"
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
                Access Denied
              </h1>
              <p className="font-sans text-lg sm:text-xl text-ink-muted leading-relaxed">
                You do not have the required permissions to access the Super Admin Portal. This area is restricted to authorized accounts only.
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 w-full max-w-[480px] mx-auto lg:mx-0 shadow-sm">
              <div className="space-y-4">
                <h2 className="font-sans font-semibold text-lg text-ink mb-4">
                  Please log in with an authorized account
                </h2>

                {/* Sign Out & Switch Account Button */}
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full h-[48px] bg-primary text-primary-foreground font-sans font-medium text-[15px] rounded-md hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  <LogOut className="h-4.5 w-4.5 group-hover:scale-105 transition-transform" />
                  {isLoggingOut ? "Signing out..." : "Sign Out & Switch Account"}
                </button>

                {/* Back to Homepage */}
                <Link
                  href="/"
                  className="w-full h-[48px] border border-rule-strong bg-paper text-ink font-sans font-medium text-[15px] rounded-md hover:bg-paper-2 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Home className="h-4.5 w-4.5 group-hover:scale-105 transition-transform" />
                  Go to Homepage
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration (Desktop) */}
          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-page-enter">
            <div className="w-full max-w-[400px] flex justify-center">
              <Image
                src="/images/ussc-logo-lockup-black.webp"
                alt="Unauthorized Illustration"
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
