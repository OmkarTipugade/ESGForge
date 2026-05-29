import api from "./api";
import type { AuditLogEntry } from "@/types";

export const auditService = {
  async getAuditLog(recordId: number): Promise<AuditLogEntry[]> {
    const res = await api.get<AuditLogEntry[]>(
      `/records/${recordId}/audit-log/`,
    );
    return res.data;
  },
};
