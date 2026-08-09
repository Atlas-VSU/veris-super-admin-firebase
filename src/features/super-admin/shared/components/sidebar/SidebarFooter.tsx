import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp, LogOut } from "lucide-react";
import { SidebarUser, SidebarFooterProps } from "./superadmin.types";

export function SidebarFooter({ user, collapsed = false, onSignOut, hideSeparator = false, className }: SidebarFooterProps) {
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "SA";

  return (
    <div className={cn("shrink-0", className)}>
      {!hideSeparator && <Separator className="bg-blue-100" />}
      <div className={cn("border-0", !hideSeparator ? "p-3" : "p-0")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full h-auto p-2 justify-start hover:bg-blue-50 border-0 outline-none ring-0 focus-visible:ring-0 shadow-none",
                collapsed && "justify-center px-0"
              )}
            >
              <div className="flex items-center gap-2.5 w-full">
                <Avatar className={cn(
                  "shrink-0 border border-blue-200",
                  collapsed ? "size-10" : "size-7"
                )}>
                  <AvatarFallback className={cn("bg-gradient-to-br from-[#030677] to-[#2563eb] font-semibold text-white", collapsed ? "text-sm" : "text-xs")}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-medium text-slate-700">
                        {user?.name ?? "Super Admin"}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {user?.email ?? ""}
                      </p>
                    </div>
                    <ChevronUp className="size-4 text-slate-400 shrink-0" />
                  </>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align={collapsed ? "end" : "center"}
            className="w-56"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#030677] to-[#2563eb] text-xs font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name ?? "Super Admin"}</span>
                  <span className="truncate text-xs text-slate-400">{user?.email ?? ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
