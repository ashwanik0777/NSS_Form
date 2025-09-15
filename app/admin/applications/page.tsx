"use client"

import { useState } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import ApplicationsTable from "@/components/admin/ApplicationsTable"

const statusFilters = [
  { value: "all", label: "All Applications" },
  { value: "submitted", label: "Pending Review" },
  { value: "under-review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export default function ApplicationsPage() {
  const [activeFilter, setActiveFilter] = useState("all")

  return (
    <>
      <AdminHeader title="Applications" subtitle="Manage NSS volunteer applications" />

      <div className="p-6">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFilter === filter.value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Applications Table */}
        <ApplicationsTable statusFilter={activeFilter} />
      </div>
    </>
  )
}
