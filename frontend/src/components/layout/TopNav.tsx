import React from "react";
import { useLocation } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload": "Source Upload",
  "/review": "Review Queue",
};

const TopNav: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const { theme, setTheme } = useTheme();

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/records/") ? "Record Detail" : "");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      {/* Left: page title */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {user?.username.slice(0, 2) || "?"}
                </div>
                <span className="hidden sm:inline">{user?.username}</span>
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8}>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopNav;
