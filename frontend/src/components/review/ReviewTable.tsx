import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
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
import { useReviewStore } from "@/store/useReviewStore";
import FlagBadge from "./FlagBadge";
import type { EmissionRecord } from "@/types";

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
  SCOPE_1: "S1",
  SCOPE_2: "S2",
  SCOPE_3: "S3",
};

const columns: ColumnDef<EmissionRecord>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const allRows = table.getRowModel().rows;
      const store = useReviewStore.getState();
      const allSelected = allRows.every((r) =>
        store.selectedIds.has(r.original.id),
      );
      return (
        <input
          type="checkbox"
          checked={allRows.length > 0 && allSelected}
          onChange={() => {
            if (allSelected) {
              store.clearSelection();
            } else {
              store.selectRecords(allRows.map((r) => r.original.id));
            }
          }}
          className="h-3.5 w-3.5 rounded border-border accent-emerald-600"
        />
      );
    },
    cell: ({ row }) => {
      const store = useReviewStore.getState();
      const id = row.original.id;
      const isSelected = useReviewStore((s) => s.selectedIds.has(id));
      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => store.toggleRecord(id)}
          className="h-3.5 w-3.5 rounded border-border accent-emerald-600"
        />
      );
    },
    size: 36,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ getValue }) => {
      const id = getValue<number>();
      return (
        <Link
          to={`/records/${id}`}
          onClick={(e) => e.stopPropagation()}
          className="tabular-nums font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          #{id}
        </Link>
      );
    },
    size: 60,
  },
  {
    accessorKey: "activity_type",
    header: "Activity",
    cell: ({ getValue }) => (
      <span className="truncate text-xs font-medium capitalize">
        {getValue<string>().replace(/_/g, " ")}
      </span>
    ),
    size: 140,
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-[10px] font-semibold">
        {SCOPE_LABELS[getValue<string>()] || getValue<string>()}
      </Badge>
    ),
    size: 60,
  },
  {
    accessorKey: "normalized_quantity",
    header: "Qty",
    cell: ({ row }) => (
      <span className="tabular-nums text-xs">
        {Number(row.original.normalized_quantity).toLocaleString(undefined, {
          maximumFractionDigits: 1,
        })}{" "}
        <span className="text-muted-foreground text-[10px]">
          {row.original.normalized_unit}
        </span>
      </span>
    ),
    size: 120,
  },
  {
    accessorKey: "co2e_kg",
    header: "CO₂e (kg)",
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return (
        <span className="tabular-nums text-xs font-medium">
          {val
            ? Number(val).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })
            : "—"}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const badge = STATUS_BADGE[status] || STATUS_BADGE.PENDING;
      return (
        <Badge
          variant="secondary"
          className={cn("text-[10px] font-semibold", badge.className)}
        >
          {badge.label}
        </Badge>
      );
    },
    size: 80,
  },
  {
    accessorKey: "flag_reasons",
    header: "Flags",
    cell: ({ getValue }) => {
      const reasons = getValue<string[]>();
      if (reasons.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {reasons.slice(0, 2).map((r) => (
            <FlagBadge key={r} reason={r} compact />
          ))}
          {reasons.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{reasons.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: "source_type",
    header: "Source",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
    size: 80,
  },
  {
    accessorKey: "activity_start_date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {format(new Date(getValue<string>()), "dd MMM yy")}
      </span>
    ),
    size: 80,
  },
];

interface ReviewTableProps {
  data: EmissionRecord[];
  isLoading?: boolean;
}

const ReviewTable: React.FC<ReviewTableProps> = ({ data, isLoading }) => {
  const openDrawer = useReviewStore((s) => s.openDrawer);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading records…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                No records found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer text-xs transition-colors hover:bg-muted/50"
                onClick={() => openDrawer(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReviewTable;
