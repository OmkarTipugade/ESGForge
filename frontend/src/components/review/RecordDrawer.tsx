import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRecordDetail } from "@/hooks/useRecords";
import { useReviewStore } from "@/store/useReviewStore";
import ReviewActions from "./ReviewActions";
import AuditTimeline from "./AuditTimeline";
import FlagBadge from "./FlagBadge";

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
  SCOPE_1: "Scope 1",
  SCOPE_2: "Scope 2",
  SCOPE_3: "Scope 3",
};

const RecordDrawer: React.FC = () => {
  const drawerRecordId = useReviewStore((s) => s.drawerRecordId);
  const closeDrawer = useReviewStore((s) => s.closeDrawer);
  const { data: record, isLoading } = useRecordDetail(drawerRecordId);

  return (
    <Sheet open={drawerRecordId !== null} onOpenChange={() => closeDrawer()}>
      <SheetContent className="w-[480px] p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="text-base">
              Record #{drawerRecordId}
            </SheetTitle>
            {record && (
              <Link
                to={`/records/${record.id}`}
                onClick={() => closeDrawer()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Page
              </Link>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : record ? (
          <ScrollArea className="h-[calc(100vh-65px)]">
            <div className="space-y-5 p-6">
              {/* Status & Scope */}
              <div className="flex items-center gap-2">
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
                <Badge variant="outline" className="text-xs">
                  {record.source_type}
                </Badge>
              </div>

              {/* Flag reasons */}
              {record.flag_reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {record.flag_reasons.map((r) => (
                    <FlagBadge key={r} reason={r} />
                  ))}
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Activity" value={record.activity_type.replace(/_/g, " ")} />
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
                  label="Raw"
                  value={`${Number(record.raw_quantity).toLocaleString()} ${record.raw_unit}`}
                />
                <InfoField
                  label="Normalized"
                  value={`${Number(record.normalized_quantity).toLocaleString()} ${record.normalized_unit}`}
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
                <InfoField
                  label="Row #"
                  value={String(record.source_row_number)}
                />
                <InfoField
                  label="Facility"
                  value={record.facility_name || "—"}
                />
              </div>

              {/* Emission factor */}
              {record.emission_factor && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Emission Factor
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField
                        label="Factor"
                        value={Number(record.emission_factor).toFixed(6)}
                      />
                      <InfoField
                        label="Source"
                        value={record.emission_factor_source || "—"}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Review info */}
              {(record.reviewer_name || record.review_notes) && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Review Info
                    </p>
                    {(record.reviewer_name || record.reviewed_at) && (
                      <div className="grid grid-cols-2 gap-3">
                        {record.reviewer_name && <InfoField label="Reviewer" value={record.reviewer_name} />}
                        {record.reviewed_at && (
                          <InfoField
                            label="Reviewed"
                            value={format(
                              new Date(record.reviewed_at),
                              "dd MMM yyyy HH:mm",
                            )}
                          />
                        )}
                      </div>
                    )}
                    {record.review_notes && (
                      <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs font-normal normal-case text-foreground">
                        {record.review_notes}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Raw data */}
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Raw Data
                </p>
                <pre className="max-h-[200px] overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-relaxed text-emerald-400 dark:bg-slate-900">
                  {JSON.stringify(record.raw_data, null, 2)}
                </pre>
              </div>

              {/* Review actions */}
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </p>
                <ReviewActions
                  recordId={record.id}
                  currentStatus={record.status}
                  onSuccess={closeDrawer}
                />
              </div>

              {/* Audit timeline */}
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audit History
                </p>
                <AuditTimeline entries={record.audit_history} />
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground capitalize">
        {value}
      </p>
    </div>
  );
}

export default RecordDrawer;
