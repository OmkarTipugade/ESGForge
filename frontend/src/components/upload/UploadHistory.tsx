import React from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  UPLOADED: {
    label: "Uploaded",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  PARTIALLY_FAILED: {
    label: "Partial",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  SAP_FUEL: "SAP Fuel",
  UTILITY_ELECTRICITY: "Utility",
  TRAVEL: "Travel",
};

interface UploadHistoryProps {
  sources: DataSource[];
  isLoading?: boolean;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({
  sources,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading uploads…</p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No uploads yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Filename</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-right">Rows</TableHead>
            <TableHead className="text-xs text-right">Failed</TableHead>
            <TableHead className="text-xs">Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((s) => {
            const badge = STATUS_BADGE[s.status] || STATUS_BADGE.UPLOADED;
            return (
              <TableRow key={s.id} className="text-xs">
                <TableCell className="max-w-[200px] truncate font-medium">
                  {s.original_filename}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {SOURCE_LABELS[s.source_type] || s.source_type}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] font-semibold", badge.className)}
                  >
                    {badge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.total_rows.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.failed_rows > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      {s.failed_rows}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(s.uploaded_at), "dd MMM HH:mm")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default UploadHistory;
