import { create } from "zustand";
import type { RecordStatus, Scope, SourceType } from "@/types";

interface ReviewFilters {
  status?: RecordStatus;
  scope?: Scope;
  source_type?: SourceType;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface ReviewState {
  // Selection
  selectedIds: Set<number>;
  toggleRecord: (id: number) => void;
  selectRecords: (ids: number[]) => void;
  clearSelection: () => void;

  // Filters
  filters: ReviewFilters;
  setFilter: <K extends keyof ReviewFilters>(
    key: K,
    value: ReviewFilters[K],
  ) => void;
  resetFilters: () => void;

  // Drawer
  drawerRecordId: number | null;
  openDrawer: (id: number) => void;
  closeDrawer: () => void;

  // Pagination
  page: number;
  setPage: (page: number) => void;
}

const DEFAULT_FILTERS: ReviewFilters = {};

export const useReviewStore = create<ReviewState>((set) => ({
  // Selection
  selectedIds: new Set(),
  toggleRecord: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),
  selectRecords: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  // Filters
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),

  // Drawer
  drawerRecordId: null,
  openDrawer: (id) => set({ drawerRecordId: id }),
  closeDrawer: () => set({ drawerRecordId: null }),

  // Pagination
  page: 1,
  setPage: (page) => set({ page }),
}));
