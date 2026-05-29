import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  FLAGGED: {
    label: "Flagged",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  LOCKED: {
    label: "Locked",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
};

interface StatusBreakdownProps {
  data: DashboardSummary["by_status"];
}

const StatusBreakdown: React.FC<StatusBreakdownProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = data[key] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className={cn("h-2 w-2 shrink-0 rounded-full", config.dot)}
              />
              <span className="min-w-[72px] text-xs text-muted-foreground">
                {config.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", config.dot)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <Badge
                variant="secondary"
                className={cn("text-[10px] font-semibold", config.color)}
              >
                {count.toLocaleString()}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StatusBreakdown;
