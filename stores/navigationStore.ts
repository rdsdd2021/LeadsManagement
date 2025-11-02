import { create } from 'zustand'

interface NavigationState {
  // Navigation mode
  isFilteredMode: boolean // true = navigating within filtered results
  
  // Current lead being viewed
  currentLeadId: string | null
  currentLeadIndex: number | null
  
  // Filtered lead IDs (for "Next" navigation)
  filteredLeadIds: string[]
  totalFilteredCount: number
  
  // Actions
  enterFilteredMode: (leadIds: string[], totalCount: number) => void
  exitFilteredMode: () => void
  setCurrentLead: (leadId: string, index: number) => void
  goToNextLead: () => void
  goToPreviousLead: () => void
  clearCurrentLead: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  // Initial state
  isFilteredMode: false,
  currentLeadId: null,
  currentLeadIndex: null,
  filteredLeadIds: [],
  totalFilteredCount: 0,

  // Actions
  enterFilteredMode: (leadIds, totalCount) =>
    set({
      isFilteredMode: true,
      filteredLeadIds: leadIds,
      totalFilteredCount: totalCount,
    }),

  exitFilteredMode: () =>
    set({
      isFilteredMode: false,
      filteredLeadIds: [],
      totalFilteredCount: 0,
      currentLeadId: null,
      currentLeadIndex: null,
    }),

  setCurrentLead: (leadId, index) =>
    set({
      currentLeadId: leadId,
      currentLeadIndex: index,
    }),

  goToNextLead: () => {
    const state = get()
    const { currentLeadIndex, filteredLeadIds, isFilteredMode } = state

    if (!isFilteredMode || currentLeadIndex === null) return

    const nextIndex = currentLeadIndex + 1

    if (nextIndex < filteredLeadIds.length) {
      set({
        currentLeadIndex: nextIndex,
        currentLeadId: filteredLeadIds[nextIndex],
      })
    }
  },

  goToPreviousLead: () => {
    const state = get()
    const { currentLeadIndex, filteredLeadIds, isFilteredMode } = state

    if (!isFilteredMode || currentLeadIndex === null) return

    const prevIndex = currentLeadIndex - 1

    if (prevIndex >= 0) {
      set({
        currentLeadIndex: prevIndex,
        currentLeadId: filteredLeadIds[prevIndex],
      })
    }
  },

  clearCurrentLead: () =>
    set({
      currentLeadId: null,
      currentLeadIndex: null,
    }),
}))