import api from "./api";
import type {
  DataSource,
  SourceType,
  PaginatedResponse,
  SourceFilters,
} from "@/types";

export const sourcesService = {
  async uploadFile(file: File, sourceType: SourceType): Promise<DataSource> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_type", sourceType);

    const res = await api.post<DataSource>("/sources/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getSources(
    filters: SourceFilters = {},
  ): Promise<PaginatedResponse<DataSource>> {
    const params: Record<string, string | number> = {};
    if (filters.source_type) params.source_type = filters.source_type;
    if (filters.status) params.status = filters.status;
    if (filters.page) params.page = filters.page;

    const res = await api.get<PaginatedResponse<DataSource>>("/sources/", {
      params,
    });
    return res.data;
  },

  async getSourceDetail(id: number): Promise<DataSource> {
    const res = await api.get<DataSource>(`/sources/${id}/`);
    return res.data;
  },
};
