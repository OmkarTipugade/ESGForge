import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Lock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRecords, useBulkApprove, useLockRecords } from "@/hooks/useRecords";
import { useReviewStore } from "@/store/useReviewStore";
import { useAuthStore } from "@/store/useAuthStore";
import ReviewTable from "@/components/review/ReviewTable";
import RecordDrawer from "@/components/review/RecordDrawer";
import toast from "react-hot-toast";
import type { RecordStatus, Scope } from "@/types";

const STATUS_TABS: { value: RecordStatus | "ALL"; label: string; count?: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "FLAGGED", label: "Suspicious" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "LOCKED", label: "Locked" },
];

const ReviewQueue: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const filters = useReviewStore((s) => s.filters);
  const setFilter = useReviewStore((s) => s.setFilter);
  const page = useReviewStore((s) => s.page);
  const setPage = useReviewStore((s) => s.setPage);
  const selectedIds = useReviewStore((s) => s.selectedIds);
  const clearSelection = useReviewStore((s) => s.clearSelection);

  const bulkApproveMutation = useBulkApprove();
  const lockMutation = useLockRecords();

  // Build query params
  const queryFilters = {
    ...filters,
    status: filters.status === ("ALL" as RecordStatus) ? undefined : filters.status,
    page,
  };

  const { data, isLoading, isFetching } = useRecords(queryFilters);

  const handleBulkApprove = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    bulkApproveMutation.mutate(
      { record_ids: ids },
      {
        onSuccess: (result) => {
          toast.success(`${result.approved_count} records approved`);
          clearSelection();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || "Bulk approve failed");
        },
      },
    );
  };

  const handleLock = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    lockMutation.mutate(
      { record_ids: ids },
      {
        onSuccess: (result) => {
          toast.success(`${result.locked_count} records locked for audit`);
          clearSelection();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || "Lock failed");
        },
      },
    );
  };

  const totalPages = data ? Math.ceil(data.count / 50) : 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() =>
                setFilter(
                  "status",
                  tab.value === "ALL"
                    ? undefined
                    : (tab.value as RecordStatus),
                )
              }
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                (filters.status || "ALL") === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scope filter */}
        <Select
          value={filters.scope || "all"}
          onValueChange={(v) =>
            setFilter("scope", v === "all" ? undefined : (v as Scope))
          }
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="All scopes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            <SelectItem value="SCOPE_1">Scope 1</SelectItem>
            <SelectItem value="SCOPE_2">Scope 2</SelectItem>
            <SelectItem value="SCOPE_3">Scope 3</SelectItem>
          </SelectContent>
        </Select>

        {/* Source type filter */}
        <Select
          value={filters.source_type || "all"}
          onValueChange={(v) =>
            setFilter(
              "source_type",
              v === "all" ? undefined : (v as any),
            )
          }
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="SAP_FUEL">SAP Fuel</SelectItem>
            <SelectItem value="UTILITY_ELECTRICITY">Utility</SelectItem>
            <SelectItem value="TRAVEL">Travel</SelectItem>
          </SelectContent>
        </Select>

        {/* Date filters */}
        <Input
          type="date"
          placeholder="From"
          value={filters.date_from || ""}
          onChange={(e) => setFilter("date_from", e.target.value || undefined)}
          className="h-8 w-[140px] text-xs"
        />
        <Input
          type="date"
          placeholder="To"
          value={filters.date_to || ""}
          onChange={(e) => setFilter("date_to", e.target.value || undefined)}
          className="h-8 w-[140px] text-xs"
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Loading indicator */}
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {/* Record count */}
        {data && (
          <Badge variant="outline" className="text-xs tabular-nums">
            {data.count.toLocaleString()} records
          </Badge>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
          <span className="text-xs font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkApproveMutation.isPending}
            className="h-7 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
          >
            {bulkApproveMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3 w-3" />
            )}
            Approve Selected
          </Button>

          {user?.role === "ADMIN" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLock}
              disabled={lockMutation.isPending}
              className="h-7 text-xs"
            >
              {lockMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Lock className="mr-1.5 h-3 w-3" />
              )}
              Lock for Audit
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <ReviewTable data={data?.results || []} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Record Drawer */}
      <RecordDrawer />
    </div>
  );
};

export default ReviewQueue;
