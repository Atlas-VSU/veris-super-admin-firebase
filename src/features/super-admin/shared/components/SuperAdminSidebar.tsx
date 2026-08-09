"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen, Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { cacheUtils } from "@/utils/cacheUtils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarBrand } from "./sidebar/SidebarBrand";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SuperAdminSidebarProps, SidebarUser } from "./sidebar/superadmin.types";
import { Separator } from "@/components/ui/separator";

function NavContent({
  pathname,
  collapsed = false,
  onNavigate,
  user,
  onSignOut,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  user?: SidebarUser;
  onSignOut: () => void;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col overflow-hidden">
        <SidebarBrand collapsed={collapsed} />
        <Separator className="bg-blue-100 shrink-0" />
        <SidebarNav pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        <SidebarFooter user={user} collapsed={collapsed} onSignOut={onSignOut} />
      </div>
    </TooltipProvider>
  );
}

export function SuperAdminSidebar({ user, className }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      cacheUtils.setSigningOut(true);
      cacheUtils.clearOnLogout();
      await Promise.allSettled([
        signOut(auth),
        fetch("/api/auth/signout", { method: "POST", credentials: "include" }),
      ]);
      window.location.href = "/?logout=true";
    } catch {
      cacheUtils.clearOnLogout();
      window.location.href = "/?logout=true";
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-blue-100 bg-white xl:flex xl:flex-col transition-[width] duration-200 ease-in-out sticky top-0 h-svh z-50",
          collapsed ? "w-17" : "w-64",
          className
        )}
      >
        <NavContent
          pathname={pathname}
          collapsed={collapsed}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-18 z-10 flex size-6 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-400 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3" />
          ) : (
            <PanelLeftClose className="size-3" />
          )}
        </button>
      </aside>

      {/* Tablet top bar */}
      <div
        className="hidden md:flex xl:hidden fixed inset-x-0 top-0 z-40 h-14 items-center justify-between border-b border-blue-100 bg-white px-4"
        suppressHydrationWarning
      >
        {/* Brand in top bar */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-start shrink-0">
            <span className="text-xl font-extrabold uppercase bg-gradient-to-r from-[#030677] to-[#2563eb] bg-clip-text text-transparent tracking-wide leading-none">
              VERIS
            </span>
            <Settings className="size-3 text-[#2563eb] ml-0.5 mt-0.5" />
          </div>
        </div>

        {/* Avatar in top bar */}
        {mounted && (
          <SidebarFooter 
            user={user} 
            collapsed={true} 
            onSignOut={handleSignOut} 
            hideSeparator={true} 
            className="w-auto border-0"
          />
        )}
      </div>
    </>
  );
}
