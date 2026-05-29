import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

const ACTION_CONFIG: Record<
  string,
  { color: string; dotColor: string; label: string }
> = {
  CREATED: {
    color: "text-slate-600 dark:text-slate-400",
    dotColor: "bg-slate-500",
    label: "Created",
  },
  APPROVED: {
    color: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    label: "Approved",
  },
  REJECTED: {
    color: "text-rose-600 dark:text-rose-400",
    dotColor: "bg-rose-500",
    label: "Rejected",
  },
  FLAGGED: {
    color: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    label: "Flagged",
  },
  LOCKED: {
    color: "text-violet-600 dark:text-violet-400",
    dotColor: "bg-violet-500",
    label: "Locked",
  },
  STATUS_CHANGED: {
    color: "text-sky-600 dark:text-sky-400",
    dotColor: "bg-sky-500",
    label: "Status Changed",
  },
  FIELD_EDITED: {
    color: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
    label: "Field Edited",
  },
};

const DEFAULT_ACTION = {
  color: "text-slate-600 dark:text-slate-400",
  dotColor: "bg-slate-500",
  label: "Action",
};

interface AuditTimelineProps {
  entries: AuditLogEntry[];
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No audit history
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      {entries.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || DEFAULT_ACTION;
        return (
          <div key={entry.id} className="relative flex gap-3 py-2">
            {/* Dot */}
            <div
              className={cn(
                "relative z-10 mt-1 h-[14px] w-[14px] shrink-0 rounded-full border-2 border-background",
                config.dotColor,
              )}
            />
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-xs font-semibold", config.color)}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  by {entry.performed_by_name}
                </span>
              </div>
              {entry.old_value && entry.new_value && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {entry.field_name
                    ? `${entry.field_name}: `
                    : ""}
                  {entry.old_value} → {entry.new_value}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditTimeline;
