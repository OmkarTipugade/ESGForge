import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FLAG_SEVERITY: Record<
  string,
  { label: string; color: string; level: "error" | "warning" | "info" }
> = {
  quantity_outlier: {
    label: "Quantity Outlier",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    level: "error",
  },
  negative_value: {
    label: "Negative Value",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    level: "error",
  },
  missing_emission_factor: {
    label: "Missing EF",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
    level: "error",
  },
  unknown_unit: {
    label: "Unknown Unit",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    level: "warning",
  },
  estimated_read: {
    label: "Estimated",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    level: "warning",
  },
  duplicate_period: {
    label: "Duplicate",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    level: "warning",
  },
  missing_airport_code: {
    label: "Missing Airport",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
    level: "info",
  },
  unknown_plant_code: {
    label: "Unknown Plant",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
    level: "info",
  },
};

const DEFAULT_FLAG = {
  color:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  level: "warning" as const,
};

interface FlagBadgeProps {
  reason: string;
  compact?: boolean;
}

const FlagBadge: React.FC<FlagBadgeProps> = ({ reason, compact = false }) => {
  const config = FLAG_SEVERITY[reason] || {
    ...DEFAULT_FLAG,
    label: reason.replace(/_/g, " "),
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold capitalize",
        config.color,
        compact && "px-1.5 py-0",
      )}
    >
      {config.label}
    </Badge>
  );
};

export default FlagBadge;
