import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import type { DataSource } from "@/types";

interface ValidationSummaryProps {
  source: DataSource;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ source }) => {
  const hasErrors =
    source.failed_rows > 0 || Object.keys(source.error_summary).length > 0;
  const errorEntries = Object.entries(source.error_summary);
  const categoryEntries = Object.entries(source.error_categories).filter(
    ([, v]) => v > 0,
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {hasErrors ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-lg font-bold tabular-nums text-foreground">
              {source.total_rows}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Rows
            </p>
          </div>
          <div className="rounded-lg bg-emerald-500/5 px-3 py-2 text-center">
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {source.successful_rows}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Success
            </p>
          </div>
          <div className="rounded-lg bg-rose-500/5 px-3 py-2 text-center">
            <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {source.failed_rows}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Failed
            </p>
          </div>
        </div>

        {/* Error categories */}
        {categoryEntries.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Error Categories
            </p>
            <div className="space-y-1.5">
              {categoryEntries.map(([key, count]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-amber-500/5 px-3 py-1.5 text-xs"
                >
                  <span className="text-foreground">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row-level errors (first 10) */}
        {errorEntries.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Row Errors (showing {Math.min(errorEntries.length, 10)} of{" "}
              {errorEntries.length})
            </p>
            <div className="max-h-[200px] space-y-1 overflow-auto">
              {errorEntries.slice(0, 10).map(([row, error]) => (
                <div
                  key={row}
                  className="flex items-start gap-2 rounded-md bg-rose-500/5 px-3 py-1.5 text-xs"
                >
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
                  <span className="text-foreground">
                    <span className="font-semibold">Row {row}:</span> {error}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing error */}
        {source.processing_error && (
          <div className="rounded-md bg-rose-500/10 px-3 py-2">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {source.processing_error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationSummary;
