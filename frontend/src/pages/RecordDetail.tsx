import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRecordDetail } from "@/hooks/useRecords";
import ReviewActions from "@/components/review/ReviewActions";
import AuditTimeline from "@/components/review/AuditTimeline";
import FlagBadge from "@/components/review/FlagBadge";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  FLAGGED: {
    label: "Flagged",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  LOCKED: {
    label: "Locked",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

const SCOPE_LABELS: Record<string, string> = {
  SCOPE_1: "Scope 1 — Direct Emissions",
  SCOPE_2: "Scope 2 — Purchased Energy",
  SCOPE_3: "Scope 3 — Other Indirect",
};

const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const recordId = id ? parseInt(id) : null;
  const { data: record, isLoading } = useRecordDetail(recordId);

  if (isLoading || !record) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link to="/review">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Review Queue
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Record #{record.id}
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {record.activity_type.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-semibold",
              STATUS_BADGE[record.status]?.className,
            )}
          >
            {STATUS_BADGE[record.status]?.label || record.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {SCOPE_LABELS[record.scope] || record.scope}
          </Badge>
        </div>
      </div>

      {/* Flag reasons */}
      {record.flag_reasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {record.flag_reasons.map((r) => (
            <FlagBadge key={r} reason={r} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key metrics */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Record Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoField
                  label="Raw Quantity"
                  value={`${Number(record.raw_quantity).toLocaleString()} ${record.raw_unit}`}
                />
                <InfoField
                  label="Normalized"
                  value={`${Number(record.normalized_quantity).toLocaleString()} ${record.normalized_unit}`}
                />
                <InfoField
                  label="CO₂e (kg)"
                  value={
                    record.co2e_kg
                      ? Number(record.co2e_kg).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "—"
                  }
                />
                <InfoField
                  label="Emission Factor"
                  value={
                    record.emission_factor
                      ? Number(record.emission_factor).toFixed(6)
                      : "—"
                  }
                />
                <InfoField
                  label="EF Source"
                  value={record.emission_factor_source || "—"}
                />
                <InfoField
                  label="Activity Date"
                  value={format(
                    new Date(record.activity_start_date),
                    "dd MMM yyyy",
                  )}
                />
                <InfoField
                  label="Source File"
                  value={record.source_filename}
                />
                <InfoField label="Row #" value={String(record.source_row_number)} />
                <InfoField label="Facility" value={record.facility_name || "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Raw data */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Raw Data (Original CSV Row)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[300px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-emerald-400 dark:bg-slate-900">
                {JSON.stringify(record.raw_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Review actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Review Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewActions
                recordId={record.id}
                currentStatus={record.status}
              />
            </CardContent>
          </Card>

          {/* Review info */}
          {(record.reviewer_name || record.review_notes) && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Review Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {record.reviewer_name && <InfoField label="Reviewer" value={record.reviewer_name} />}
                {record.reviewed_at && (
                  <InfoField
                    label="Reviewed At"
                    value={format(
                      new Date(record.reviewed_at),
                      "dd MMM yyyy HH:mm",
                    )}
                  />
                )}
                {record.review_notes && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-0.5 text-xs font-normal normal-case text-foreground">
                      {record.review_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit trail */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Audit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTimeline entries={record.audit_history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground capitalize">
        {value}
      </p>
    </div>
  );
}

export default RecordDetail;
