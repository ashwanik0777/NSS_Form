"use client"

import { createContext, useContext } from "react"

interface AdminLayoutContextValue {
  /** Call this to open the mobile sidebar drawer */
  openMobileSidebar: () => void
}

export const AdminLayoutContext = createContext<AdminLayoutContextValue>({
  openMobileSidebar: () => {},
})

export const useAdminLayout = () => useContext(AdminLayoutContext)
