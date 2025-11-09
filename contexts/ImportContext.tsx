'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ImportProgress } from '@/components/import-progress/ImportProgress'

interface ImportContextType {
  startImport: (jobId: string) => void
  closeImport: () => void
  currentJobId: string | null
}

const ImportContext = createContext<ImportContextType | undefined>(undefined)

export function ImportProvider({ children }: { children: ReactNode }) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  const startImport = (jobId: string) => {
    setCurrentJobId(jobId)
  }

  const closeImport = () => {
    setCurrentJobId(null)
  }

  return (
    <ImportContext.Provider value={{ startImport, closeImport, currentJobId }}>
      {children}
      {currentJobId && (
        <ImportProgress jobId={currentJobId} onClose={closeImport} />
      )}
    </ImportContext.Provider>
  )
}

export function useImport() {
  const context = useContext(ImportContext)
  if (context === undefined) {
    throw new Error('useImport must be used within an ImportProvider')
  }
  return context
}
