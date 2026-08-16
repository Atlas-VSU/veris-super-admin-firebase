import { Settings } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SidebarBrandProps } from "./superadmin.types";


export function SidebarBrand({ collapsed = false }: SidebarBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-5 shrink-0",
        collapsed && "justify-center px-0"
      )}
    >
      <div className={cn(
        "flex shrink-0 items-center justify-center rounded-xl overflow-hidden",
        collapsed ? "size-11" : "size-9"
      )}>
        <Image
          src="/images/veris-logo-superadmin.png"
          alt="VERIS Logo"
          width={collapsed ? 60 : 40}
          height={collapsed ? 60 : 40}
          className="object-contain w-full h-full"
        />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex items-start">
          <p className="truncate text-3xl font-extrabold uppercase leading-none tracking-wide bg-gradient-to-r from-[#030677] to-[#2563eb] bg-clip-text text-transparent">
            VERIS
          </p>
          <Settings className="size-3.5 text-[#2563eb] ml-0.5 mt-0.5 shrink-0" />
        </div>
      )}
    </div>
  );
}
