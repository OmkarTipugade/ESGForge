import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.getSummary(),
    staleTime: 30 * 1000, // 30s — dashboard is a hot view
    refetchInterval: 60 * 1000, // auto-refresh every minute
  });
}
