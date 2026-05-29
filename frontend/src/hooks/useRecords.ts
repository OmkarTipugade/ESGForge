import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recordsService } from "@/services/records";
import type {
  RecordFilters,
  ReviewAction,
  BulkApproveRequest,
  LockRequest,
} from "@/types";

export function useRecords(filters: RecordFilters = {}) {
  return useQuery({
    queryKey: ["records", filters],
    queryFn: () => recordsService.getRecords(filters),
    staleTime: 15 * 1000,
  });
}

export function useRecordDetail(id: number | null) {
  return useQuery({
    queryKey: ["record-detail", id],
    queryFn: () => recordsService.getRecordDetail(id!),
    enabled: id !== null,
    staleTime: 10 * 1000,
  });
}

export function useReviewRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewAction }) =>
      recordsService.reviewRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["record-detail"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useBulkApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkApproveRequest) => recordsService.bulkApprove(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useLockRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LockRequest) => recordsService.lockRecords(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
