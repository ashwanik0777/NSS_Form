"use client"

import { useState, useEffect } from "react"

interface Application {
  schoolName: string
  signature: any
  highSchoolCertificate: any
  myBharatPortalId: string
  myBharatPortalScreenshot: any
  elpProof: any
  otherAchievementsCertificates: any
  _id: string
  // Institution Details
  institutionName: string
  formNo: string
  enrollment: "first-year" | "second-year"
  programOfficerName: string
  unitNo: string

  // Personal Details
  nameEnglish: string
  nameHindi: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  mobileNo: string
  emailId: string
  departmentName: string
  gender: "male" | "female" | "other"
  category: "general" | "obc" | "st" | "sc"
  institutionalIdCard: string
  photo?: string // URL or base64

  // Educational Details
  highSchoolRollNo: string
  classSemester: string

  // NSS enrollment details
  nssEnrollmentYear: "first-year" | "second-year"
  attendedSpecialCamp: boolean
  specialCampDetails?: {
    proof: any
    villageName: string
    date: string
    venue: string
  }
  myBharatPortalRegistered: boolean

  // Additional achievements section
  specialNSSAchievements?: string
  attendedELP: boolean
  otherAchievements?: string

  // Status
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
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingApp, setViewingApp] = useState<Application | null>(null)
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

  const fetchApplicationDetails = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`)
      const data = await response.json()
      if (data.success) {
        setViewingApp(data.application)
        setShowViewModal(true)
      }
    } catch (error) {
      console.error("Error fetching application details:", error)
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
                        onClick={() => fetchApplicationDetails(app._id)}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      {app.status === "submitted" && (
                        <button
                          onClick={() => {
                            setSelectedApp(app)
                            setShowReviewModal(true)
                          }}
                          className="text-secondary hover:text-secondary/80 text-sm font-medium transition-colors"
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

      {/* View Details Modal */}
      {showViewModal && viewingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">Application Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingApp(null)
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Institution Details */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">Institution Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Institution Name</label>
                    <p className="text-foreground">{viewingApp.institutionName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School Name</label>
                    <p className="text-foreground">{viewingApp.schoolName || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Form Number</label>
                    <p className="text-foreground">{viewingApp.formNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Enrollment</label>
                    <p className="text-foreground">{viewingApp.enrollment === "first-year" ? "First Year / प्रथम वर्ष" : "Second Year / द्वितीय वर्ष"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Programme Coordinator</label>
                    <p className="text-foreground">{viewingApp.programOfficerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Number</label>
                    <p className="text-foreground">{viewingApp.unitNo}</p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name (English)</label>
                    <p className="text-foreground">{viewingApp.nameEnglish}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                    <p className="text-foreground">{viewingApp.fatherName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mother's Name</label>
                    <p className="text-foreground">{viewingApp.motherName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{viewingApp.dateOfBirth ? new Date(viewingApp.dateOfBirth).toLocaleDateString("en-IN") : "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <p className="text-foreground">{viewingApp.mobileNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email ID</label>
                    <p className="text-foreground">{viewingApp.emailId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-foreground">{viewingApp.departmentName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-foreground">{viewingApp.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-foreground">{viewingApp.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Institution I-Card No.</label>
                    <p className="text-foreground">{viewingApp.institutionalIdCard}</p>
                  </div>
                </div>
                <div className="flex gap-8 mt-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student Photo</label>
                    <div className="w-32 h-40 border border-border rounded bg-muted flex items-center justify-center overflow-hidden">
                      {viewingApp.photo ? (
                        <img src={viewingApp.photo} alt="Student Photo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No Photo</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student Signature</label>
                    <div className="w-32 h-16 border border-border rounded bg-muted flex items-center justify-center overflow-hidden">
                      {viewingApp.signature ? (
                        <img src={viewingApp.signature} alt="Student Signature" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No Signature</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Educational Details */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">Educational Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">High School Roll No</label>
                    <p className="text-foreground">{viewingApp.highSchoolRollNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Class/Semester</label>
                    <p className="text-foreground">{viewingApp.classSemester}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">High School Certificate/Marksheet</label>
                    <div>
                      {viewingApp.highSchoolCertificate ? (
                        <a
                          href={viewingApp.highSchoolCertificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* NSS & Additional Details */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">NSS & Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NSS Enrollment Year</label>
                    <p className="text-foreground">{viewingApp.nssEnrollmentYear === "first-year" ? "First Year / प्रथम वर्ष" : viewingApp.nssEnrollmentYear === "second-year" ? "Second Year / द्वितीय वर्ष" : ""}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attended 07-Day Special Camp</label>
                    <p className="text-foreground">{viewingApp.attendedSpecialCamp ? "Yes / हाँ" : "No / नहीं"}</p>
                  </div>
                  {viewingApp.attendedSpecialCamp && viewingApp.specialCampDetails && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Village/Urban Slum Name</label>
                        <p className="text-foreground">{viewingApp.specialCampDetails.villageName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Camp Date</label>
                        <p className="text-foreground">{viewingApp.specialCampDetails.date ? new Date(viewingApp.specialCampDetails.date).toLocaleDateString("en-IN") : "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Camp Venue</label>
                        <p className="text-foreground">{viewingApp.specialCampDetails.venue}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Camp Proof Certificate</label>
                        {viewingApp.specialCampDetails.proof ? (
                          <a
                            href={viewingApp.specialCampDetails.proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                          >
                            View Certificate
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not Uploaded</span>
                        )}
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">My Bharat Portal Registration</label>
                    <p className="text-foreground">{viewingApp.myBharatPortalRegistered ? "Yes / हाँ" : "No / नहीं"}</p>
                  </div>
                  {viewingApp.myBharatPortalRegistered && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">My Bharat Portal ID</label>
                        <p className="text-foreground">{viewingApp.myBharatPortalId || "—"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">My Bharat Portal Screenshot</label>
                        {viewingApp.myBharatPortalScreenshot ? (
                          <a
                            href={viewingApp.myBharatPortalScreenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                          >
                            View Screenshot
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not Uploaded</span>
                        )}
                      </div>
                    </>
                  )}
                  {viewingApp.specialNSSAchievements && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Special NSS Achievements</label>
                      <p className="text-foreground">{viewingApp.specialNSSAchievements}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attended ELP (Experiential Learning Programme)</label>
                    <p className="text-foreground">{viewingApp.attendedELP ? "Yes / हाँ" : "No / नहीं"}</p>
                  </div>
                  {viewingApp.elpProof && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ELP Proof</label>
                      <a
                        href={viewingApp.elpProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                      >
                        View ELP Proof
                      </a>
                    </div>
                  )}
                  {viewingApp.otherAchievements && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Other Achievements</label>
                      <p className="text-foreground">{viewingApp.otherAchievements}</p>
                    </div>
                  )}
                  {viewingApp.otherAchievementsCertificates && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Other Achievement Certificates</label>
                      <a
                        href={viewingApp.otherAchievementsCertificates}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                      >
                        View Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-3">Application Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                    <div className="mt-1">{getStatusBadge(viewingApp.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted At</label>
                    <p className="text-foreground">{new Date(viewingApp.submittedAt).toLocaleString("en-IN")}</p>
                  </div>
                  {viewingApp.reviewedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reviewed At</label>
                      <p className="text-foreground">{new Date(viewingApp.reviewedAt).toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {viewingApp.rejectionReason && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                      <p className="text-foreground bg-red-50 p-3 rounded-lg border border-red-200">
                        {viewingApp.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
