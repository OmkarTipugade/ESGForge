import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Flag, Loader2 } from "lucide-react";
import { useReviewRecord } from "@/hooks/useRecords";
import toast from "react-hot-toast";
import type { RecordStatus } from "@/types";

interface ReviewActionsProps {
  recordId: number;
  currentStatus: RecordStatus;
  onSuccess?: () => void;
}

const ReviewActions: React.FC<ReviewActionsProps> = ({
  recordId,
  currentStatus,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const reviewMutation = useReviewRecord();

  const isLocked = currentStatus === "LOCKED";

  const handleAction = (action: "APPROVE" | "REJECT" | "FLAG") => {
    reviewMutation.mutate(
      { id: recordId, data: { action, notes } },
      {
        onSuccess: () => {
          toast.success(
            action === "APPROVE"
              ? "Record approved"
              : action === "REJECT"
                ? "Record rejected"
                : "Record flagged",
          );
          setNotes("");
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.error || `Failed to ${action.toLowerCase()}`,
          );
        },
      },
    );
  };

  if (isLocked) {
    return (
      <div className="rounded-lg bg-violet-500/5 px-4 py-3">
        <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
          This record is locked for audit and cannot be modified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Review notes (optional)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="resize-none text-xs"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleAction("APPROVE")}
          disabled={reviewMutation.isPending}
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {reviewMutation.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction("REJECT")}
          disabled={reviewMutation.isPending}
          className="flex-1"
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction("FLAG")}
          disabled={reviewMutation.isPending}
          className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
        >
          <Flag className="mr-1.5 h-3.5 w-3.5" />
          Flag
        </Button>
      </div>
    </div>
  );
};

export default ReviewActions;
