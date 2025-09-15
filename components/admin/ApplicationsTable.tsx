"use client"

import { useState, useEffect } from "react"

interface Application {
  _id: string
  nameEnglish: string
  emailId: string
  institutionName: string
  status: "submitted" | "under-review" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
}

interface ApplicationsTableProps {
  statusFilter?: string
}

export default function ApplicationsTable({ statusFilter = "all" }: ApplicationsTableProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/applications?status=${statusFilter}`)
      const data = await response.json()
      if (data.success) {
        setApplications(data.applications)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedApp) return

    try {
      const response = await fetch(`/api/applications/${selectedApp._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewAction === "approve" ? "approved" : "rejected",
          rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
          reviewedBy: "admin-user-id", // This should come from auth context
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowReviewModal(false)
        setSelectedApp(null)
        setRejectionReason("")
        fetchApplications()
      }
    } catch (error) {
      console.error("Error reviewing application:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      "under-review": "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status as keyof typeof statusStyles]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Institution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-muted/25">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{app.nameEnglish}</div>
                      <div className="text-sm text-muted-foreground">{app.emailId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{app.institutionName}</td>
                  <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(app.submittedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          /* View details */
                        }}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        View
                      </button>
                      {app.status === "submitted" && (
                        <button
                          onClick={() => {
                            setSelectedApp(app)
                            setShowReviewModal(true)
                          }}
                          className="text-secondary hover:text-secondary/80 text-sm font-medium"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">No applications</h3>
            <p className="mt-1 text-sm text-muted-foreground">No applications found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Review Application</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reviewing application from <strong>{selectedApp.nameEnglish}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Action</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reviewAction"
                      value="approve"
                      checked={reviewAction === "approve"}
                      onChange={(e) => setReviewAction(e.target.value as "approve" | "reject")}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reviewAction"
                      value="reject"
                      checked={reviewAction === "reject"}
                      onChange={(e) => setReviewAction(e.target.value as "approve" | "reject")}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Reject</span>
                  </label>
                </div>
              </div>

              {reviewAction === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedApp(null)
                  setRejectionReason("")
                }}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewAction === "reject" && !rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
