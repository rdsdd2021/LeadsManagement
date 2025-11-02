import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
  // Filter values
  status: string[]
  category: string[]
  region: string[]
  searchQuery: string
  dateRange: {
    from: Date | null
    to: Date | null
  }
  
  // Custom field filters (dynamic)
  customFilters: Record<string, any>
  
  // Pagination
  page: number
  pageSize: number
  
  // Actions
  setStatus: (status: string[]) => void
  setCategory: (category: string[]) => void
  setRegion: (region: string[]) => void
  setSearchQuery: (query: string) => void
  setDateRange: (from: Date | null, to: Date | null) => void
  setCustomFilter: (key: string, value: any) => void
  removeCustomFilter: (key: string) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  clearAllFilters: () => void
  resetPagination: () => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      // Initial state
      status: [],
      category: [],
      region: [],
      searchQuery: '',
      dateRange: {
        from: null,
        to: null,
      },
      customFilters: {},
      page: 0,
      pageSize: 100,

      // Actions
      setStatus: (status) => set({ status, page: 0 }), // Reset page when filter changes
      setCategory: (category) => set({ category, page: 0 }),
      setRegion: (region) => set({ region, page: 0 }),
      setSearchQuery: (searchQuery) => set({ searchQuery, page: 0 }),
      setDateRange: (from, to) => set({ dateRange: { from, to }, page: 0 }),
      
      setCustomFilter: (key, value) =>
        set((state) => ({
          customFilters: { ...state.customFilters, [key]: value },
          page: 0,
        })),
      
      removeCustomFilter: (key) =>
        set((state) => {
          const { [key]: removed, ...rest } = state.customFilters
          return { customFilters: rest, page: 0 }
        }),
      
      setPage: (page) => set({ page }),
      setPageSize: (pageSize) => set({ pageSize, page: 0 }),
      
      clearAllFilters: () =>
        set({
          status: [],
          category: [],
          region: [],
          searchQuery: '',
          dateRange: { from: null, to: null },
          customFilters: {},
          page: 0,
        }),
      
      resetPagination: () => set({ page: 0 }),
    }),
    {
      name: 'lead-filters', // LocalStorage key
      partialize: (state) => ({
        // Only persist these fields
        pageSize: state.pageSize,
      }),
    }
  )
)