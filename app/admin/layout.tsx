"use client"

import type React from "react"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="sub-admin">
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
