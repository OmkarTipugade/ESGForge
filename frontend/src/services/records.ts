import api from "./api";
import type {
  EmissionRecord,
  EmissionRecordDetail,
  ReviewAction,
  BulkApproveRequest,
  BulkApproveResponse,
  LockRequest,
  LockResponse,
  PaginatedResponse,
  RecordFilters,
} from "@/types";

export const recordsService = {
  async getRecords(
    filters: RecordFilters = {},
  ): Promise<PaginatedResponse<EmissionRecord>> {
    const params: Record<string, string | number> = {};
    if (filters.status) params.status = filters.status;
    if (filters.scope) params.scope = filters.scope;
    if (filters.source_type) params.source_type = filters.source_type;
    if (filters.source_id) params.source_id = filters.source_id;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.page) params.page = filters.page;
    if (filters.ordering) params.ordering = filters.ordering;
    if (filters.search) params.search = filters.search;

    const res = await api.get<PaginatedResponse<EmissionRecord>>("/records/", {
      params,
    });
    return res.data;
  },

  async getRecordDetail(id: number): Promise<EmissionRecordDetail> {
    const res = await api.get<EmissionRecordDetail>(`/records/${id}/`);
    return res.data;
  },

  async reviewRecord(
    id: number,
    data: ReviewAction,
  ): Promise<EmissionRecordDetail> {
    const res = await api.patch<EmissionRecordDetail>(
      `/records/${id}/review/`,
      data,
    );
    return res.data;
  },

  async bulkApprove(data: BulkApproveRequest): Promise<BulkApproveResponse> {
    const res = await api.post<BulkApproveResponse>(
      "/records/bulk-approve/",
      data,
    );
    return res.data;
  },

  async lockRecords(data: LockRequest): Promise<LockResponse> {
    const res = await api.post<LockResponse>("/records/lock/", data);
    return res.data;
  },
};
