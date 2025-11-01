"use client"

import type React from "react"
import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function VolunteerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="volunteer">
      <div className="flex h-screen bg-background overflow-hidden">
        <VolunteerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

