import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
  // Filter values (immediate - for UI state)
  school: string[]
  district: string[]
  gender: string[]
  stream: string[]
  searchQuery: string
  dateRange: {
    from: Date | null
    to: Date | null
  }
  
  // Debounced filter values (delayed - for API calls)
  debouncedSchool: string[]
  debouncedDistrict: string[]
  debouncedGender: string[]
  debouncedStream: string[]
  debouncedSearchQuery: string
  debouncedDateRange: {
    from: Date | null
    to: Date | null
  }
  debouncedCustomFilters: Record<string, any>
  
  // Custom field filters (dynamic)
  customFilters: Record<string, any>
  
  // Pagination
  page: number
  pageSize: number
  paginationMode: 'standard' | 'infinite'
  
  // Actions
  setSchool: (school: string[]) => void
  setDistrict: (district: string[]) => void
  setGender: (gender: string[]) => void
  setStream: (stream: string[]) => void
  setSearchQuery: (query: string) => void
  setDateRange: (from: Date | null, to: Date | null) => void
  setCustomFilter: (key: string, value: any) => void
  removeCustomFilter: (key: string) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setPaginationMode: (mode: 'standard' | 'infinite') => void
  clearAllFilters: () => void
  resetPagination: () => void
  applyDebouncedFilters: () => void
}

// Debounce timer
let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_DELAY = 800 // 800ms delay - fast enough to feel responsive, slow enough to batch changes

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      school: [],
      district: [],
      gender: [],
      stream: [],
      searchQuery: '',
      dateRange: {
        from: null,
        to: null,
      },
      customFilters: {},
      
      // Debounced state (starts same as initial)
      debouncedSchool: [],
      debouncedDistrict: [],
      debouncedGender: [],
      debouncedStream: [],
      debouncedSearchQuery: '',
      debouncedDateRange: {
        from: null,
        to: null,
      },
      debouncedCustomFilters: {},
      
      page: 0,
      pageSize: 100,
      paginationMode: 'standard',

      // Helper to trigger debounced update
      applyDebouncedFilters: () => {
        const state = get()
        set({
          debouncedSchool: state.school,
          debouncedDistrict: state.district,
          debouncedGender: state.gender,
          debouncedStream: state.stream,
          debouncedSearchQuery: state.searchQuery,
          debouncedDateRange: state.dateRange,
          debouncedCustomFilters: state.customFilters,
        })
      },

      // Actions - Auto-apply after delay
      setSchool: (school) => {
        set({ school, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setDistrict: (district) => {
        set({ district, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setGender: (gender) => {
        set({ gender, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setStream: (stream) => {
        set({ stream, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setSearchQuery: (searchQuery) => {
        set({ searchQuery, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setDateRange: (from, to) => {
        set({ dateRange: { from, to }, page: 0 })
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      setCustomFilter: (key, value) => {
        set((state) => ({
          customFilters: { ...state.customFilters, [key]: value },
          page: 0,
        }))
        // Auto-apply after delay
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          get().applyDebouncedFilters()
        }, DEBOUNCE_DELAY)
      },
      
      removeCustomFilter: (key) => {
        set((state) => {
          const { [key]: removed, ...rest } = state.customFilters
          return { customFilters: rest, page: 0 }
        })
      },
      
      setPage: (page) => set({ page }),
      setPageSize: (pageSize) => set({ pageSize, page: 0 }),
      setPaginationMode: (paginationMode) => set({ paginationMode, page: 0 }),
      
      clearAllFilters: () => {
        set({
          school: [],
          district: [],
          gender: [],
          stream: [],
          searchQuery: '',
          dateRange: { from: null, to: null },
          customFilters: {},
          debouncedSchool: [],
          debouncedDistrict: [],
          debouncedGender: [],
          debouncedStream: [],
          debouncedSearchQuery: '',
          debouncedDateRange: { from: null, to: null },
          debouncedCustomFilters: {},
          page: 0,
        })
      },
      
      resetPagination: () => set({ page: 0 }),
    }),
    {
      name: 'lead-filters', // LocalStorage key
      partialize: (state) => ({
        // Persist filter values
        school: state.school,
        district: state.district,
        gender: state.gender,
        stream: state.stream,
        searchQuery: state.searchQuery,
        dateRange: state.dateRange,
        customFilters: state.customFilters,
        
        // Persist debounced values
        debouncedSchool: state.debouncedSchool,
        debouncedDistrict: state.debouncedDistrict,
        debouncedGender: state.debouncedGender,
        debouncedStream: state.debouncedStream,
        debouncedSearchQuery: state.debouncedSearchQuery,
        debouncedDateRange: state.debouncedDateRange,
        debouncedCustomFilters: state.debouncedCustomFilters,
        
        // Persist pagination settings
        pageSize: state.pageSize,
        paginationMode: state.paginationMode,
      }),
    }
  )
)