import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navItems, SidebarNavProps } from "./superadmin.types";

export function SidebarNav({ pathname, collapsed = false, onNavigate }: SidebarNavProps) {
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
      aria-label="Super admin navigation"
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        const linkEl = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
              collapsed && "justify-center px-0 size-10 mx-auto py-2",
              active
                ? "bg-gradient-to-r from-[#1d4ed8] to-[#60a5fa] text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:bg-blue-50 hover:text-[#2563eb]"
            )}
          >
            {active && !collapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.75 rounded-full bg-blue-300" />
            )}
            <item.icon
              className={cn("size-4 shrink-0", active && "text-white")}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }
        return linkEl;
      })}
    </nav>
  );
}
