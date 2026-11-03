"use client"

import { createContext, useContext } from "react"

interface AdminLayoutContextValue {
  /** Call this to open the mobile sidebar drawer */
  openMobileSidebar: () => void
  /** Indicates whether the currently active page rendered its own AdminHeader */
  hasPageHeader?: boolean
  setHasPageHeader?: (has: boolean) => void
}

export const AdminLayoutContext = createContext<AdminLayoutContextValue>({
  openMobileSidebar: () => {},
  hasPageHeader: false,
  setHasPageHeader: () => {},
})

export const useAdminLayout = () => useContext(AdminLayoutContext)
