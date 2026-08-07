"use client";

import { SuperAdminSidebar } from "@/features/super-admin/shared/components/SuperAdminSidebar";
import { MobileBottomNav } from "@/components/nav-bar/MobileBottomNav";
import { mobileIconMap } from "@/features/super-admin/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { cacheUtils } from "@/utils/cacheUtils";
import { superAdminData } from "@/features/super-admin/types";

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check for signing out state on mount and when auth changes
  useEffect(() => {
    const checkSigningOutState = () => {
      const signingOut = cacheUtils.isSigningOut();
      setIsSigningOut(signingOut);
    };

    checkSigningOutState();
    const interval = setInterval(checkSigningOutState, 200);
    return () => clearInterval(interval);
  }, []);

  // Redirect to appropriate page based on auth state and role
  useEffect(() => {
    if (!loading && !isSigningOut) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "super-admin") {
        router.push("/unauthorized");
      }
    }
  }, [loading, isAuthenticated, user, router, isSigningOut]);

  // Show loading screen while authenticating or signing out
  if (loading || isSigningOut) {
    return (
      <LoadingScreen
        message={
          isSigningOut
            ? "Signing out... Please come back soon!"
            : "Loading Super Admin Dashboard... Welcome! Getting things ready for you."
        }
        className="bg-primary/5"
      />
    );
  }

  // Only render layout when authenticated and has super-admin role
  if (!isAuthenticated || !user || user.role !== "super-admin") {
    return null; // Will redirect in useEffect
  }

  // Format user data for components
  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-800">
      <SuperAdminSidebar
        user={userData}
        className="z-50"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 md:mt-14 xl:mt-0 pb-20 xl:pb-10 bg-slate-50 relative">
          {children}
        </main>
        <MobileBottomNav
          links={superAdminData.mobileNavLinks}
          iconMap={mobileIconMap}
        />
      </div>
    </div>
  );
}
