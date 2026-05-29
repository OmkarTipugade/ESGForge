import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Source Upload", icon: Upload },
  { to: "/review", label: "Review Queue", icon: ClipboardCheck },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const roleBadgeColor: Record<string, string> = {
    ADMIN: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    ANALYST: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    VIEWER: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="truncate text-base font-bold tracking-tight text-white">
              ESGForge
            </h1>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Carbon Operations
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-600/15 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-400"
                    : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger render={<span />}>
                  {link}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {/* User section */}
      {user && !collapsed && (
        <div className="border-t border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold uppercase text-slate-300">
              {user.username.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">
                {user.username}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.company_name}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                roleBadgeColor[user.role] || roleBadgeColor.VIEWER,
              )}
            >
              {user.role}
            </Badge>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-slate-800 text-slate-500 transition-colors hover:bg-slate-800/40 hover:text-slate-300"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
