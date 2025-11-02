import { create } from 'zustand'

interface UIState {
  // Sidebar
  isSidebarOpen: boolean
  
  // Modals
  isLeadDetailModalOpen: boolean
  isFilterPanelOpen: boolean
  isBulkActionsModalOpen: boolean
  
  // Selected rows
  selectedLeadIds: Set<string>
  
  // Actions
  toggleSidebar: () => void
  openLeadDetailModal: () => void
  closeLeadDetailModal: () => void
  toggleFilterPanel: () => void
  openBulkActionsModal: () => void
  closeBulkActionsModal: () => void
  toggleLeadSelection: (leadId: string) => void
  selectAllLeads: (leadIds: string[]) => void
  clearSelection: () => void
  setSelectedLeads: (leadIds: string[]) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isSidebarOpen: true,
  isLeadDetailModalOpen: false,
  isFilterPanelOpen: false,
  isBulkActionsModalOpen: false,
  selectedLeadIds: new Set(),

  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  openLeadDetailModal: () => set({ isLeadDetailModalOpen: true }),
  closeLeadDetailModal: () => set({ isLeadDetailModalOpen: false }),
  
  toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
  
  openBulkActionsModal: () => set({ isBulkActionsModalOpen: true }),
  closeBulkActionsModal: () => set({ isBulkActionsModalOpen: false }),
  
  toggleLeadSelection: (leadId) =>
    set((state) => {
      const newSelected = new Set(state.selectedLeadIds)
      if (newSelected.has(leadId)) {
        newSelected.delete(leadId)
      } else {
        newSelected.add(leadId)
      }
      return { selectedLeadIds: newSelected }
    }),
  
  selectAllLeads: (leadIds) =>
    set({ selectedLeadIds: new Set(leadIds) }),
  
  clearSelection: () => set({ selectedLeadIds: new Set() }),
  
  setSelectedLeads: (leadIds) =>
    set({ selectedLeadIds: new Set(leadIds) }),
}))