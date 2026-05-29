import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sourcesService } from "@/services/sources";
import type { SourceType, SourceFilters } from "@/types";

export function useSources(filters: SourceFilters = {}) {
  return useQuery({
    queryKey: ["sources", filters],
    queryFn: () => sourcesService.getSources(filters),
    staleTime: 15 * 1000,
  });
}

export function useSourceDetail(id: number | null) {
  return useQuery({
    queryKey: ["source-detail", id],
    queryFn: () => sourcesService.getSourceDetail(id!),
    enabled: id !== null,
  });
}

export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      sourceType,
    }: {
      file: File;
      sourceType: SourceType;
    }) => sourcesService.uploadFile(file, sourceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
