import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { TooltipProvider } from "@/components/ui/tooltip";

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delay={0}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />

          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
