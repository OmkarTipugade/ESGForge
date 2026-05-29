import api from "./api";
import type { DashboardSummary } from "@/types";

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api.get<DashboardSummary>("/records/dashboard/");
    return res.data;
  },
};
