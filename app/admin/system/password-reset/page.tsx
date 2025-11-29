"use client"

import { useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import { Search, ShieldCheck, Send, LockKeyhole, MailCheck, Loader2, RefreshCw } from "lucide-react"

interface VolunteerResult {
  volunteerId: string
  name: string
  email: string
  unitNo?: string
  formNo?: string
  mobileNo?: string
  dateOfBirth?: string
  application?: {
    programOfficerName?: string
    schoolName?: string
    departmentName?: string
    enrollment?: string
    courseName?: string
    addressType?: string
    hostelAddress?: string
    homeAddress?: string
    nssEnrollmentYear?: string
    attendedSpecialCamp?: boolean
  }
}

export default function PasswordResetPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<VolunteerResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerResult | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formatDate = (value?: string) => {
    if (!value) return "N/A"
    try {
      return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return value
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery || searchQuery.trim().length < 2) {
      setErrorMessage("Enter at least 2 characters to search.")
      return
    }
    setSearching(true)
    setErrorMessage(null)
    setStatusMessage(null)
    setResetPassword(null)
    setOtpSent(false)
    setSelectedVolunteer(null)
    try {
      const res = await fetch(`/api/admin/password-reset?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.results || [])
        if ((data.results || []).length === 0) {
          setStatusMessage("No volunteers found for the provided query.")
        }
      } else {
        setErrorMessage(data.message || "Failed to fetch volunteers.")
      }
    } catch (err) {
      console.error(err)
      setErrorMessage("Unable to search volunteers right now.")
    } finally {
      setSearching(false)
    }
  }

  const handleSendOtp = async () => {
    if (!selectedVolunteer) return
    setSendingOtp(true)
    setErrorMessage(null)
    setStatusMessage(null)
    setResetPassword(null)
    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: selectedVolunteer.volunteerId }),
      })
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        setStatusMessage(data.message || "OTP sent successfully.")
      } else {
        setErrorMessage(data.message || "Failed to send OTP.")
      }
    } catch (err) {
      console.error(err)
      setErrorMessage("Unable to send OTP right now.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!selectedVolunteer || !otpCode.trim()) {
      setErrorMessage("Please enter the OTP received by the volunteer.")
      return
    }
    setVerifying(true)
    setErrorMessage(null)
    setStatusMessage(null)
    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: selectedVolunteer.volunteerId, otp: otpCode.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResetPassword(data.password || null)
        setStatusMessage("Password reset successfully and emailed to the volunteer.")
        setOtpCode("")
      } else {
        setErrorMessage(data.message || "Failed to verify OTP.")
      }
    } catch (err) {
      console.error(err)
      setErrorMessage("Unable to verify OTP right now.")
    } finally {
      setVerifying(false)
    }
  }

  const resetFlow = () => {
    setSelectedVolunteer(null)
    setOtpSent(false)
    setOtpCode("")
    setResetPassword(null)
    setStatusMessage(null)
    setErrorMessage(null)
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminHeader title="Volunteer Password Reset" subtitle="Securely reset volunteer passwords with email OTP verification" />
      <div className="p-6 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Search Volunteer</label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, form number, or mobile number"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Flow
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">Only approved volunteers are eligible for password reset.</p>
          {statusMessage && <p className="mt-4 text-sm text-emerald-600">{statusMessage}</p>}
          {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
        </div>

        {searchResults.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Select a volunteer</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((volunteer) => {
                const isActive = selectedVolunteer?.volunteerId === volunteer.volunteerId
                return (
                  <button
                    key={volunteer.volunteerId}
                    onClick={() => {
                      setSelectedVolunteer(volunteer)
                      setOtpSent(false)
                      setResetPassword(null)
                      setOtpCode("")
                      setStatusMessage(null)
                      setErrorMessage(null)
                    }}
                    className={`text-left border rounded-lg p-4 transition shadow-sm hover:shadow ${
                      isActive ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{volunteer.name}</p>
                    <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded-full bg-muted/70 text-foreground">Form #{volunteer.formNo || "N/A"}</span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Unit {volunteer.unitNo || "?"}</span>
                      {volunteer.mobileNo && <span>{volunteer.mobileNo}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedVolunteer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{selectedVolunteer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Info label="Form Number" value={selectedVolunteer.formNo || "N/A"} />
                  <Info label="Unit Number" value={selectedVolunteer.unitNo || "N/A"} />
                  <Info label="Mobile Number" value={selectedVolunteer.mobileNo || "N/A"} />
                  <Info label="Date of Birth" value={formatDate(selectedVolunteer.dateOfBirth)} />
                  <Info label="School" value={selectedVolunteer.application?.schoolName || "N/A"} />
                  <Info label="Department" value={selectedVolunteer.application?.departmentName || "N/A"} />
                  <Info label="Course" value={selectedVolunteer.application?.courseName || "N/A"} />
                  <Info label="Enrollment Year" value={selectedVolunteer.application?.enrollment || "N/A"} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Info label="Address Type" value={selectedVolunteer.application?.addressType || "N/A"} />
                  <Info label="NSS Enrollment" value={selectedVolunteer.application?.nssEnrollmentYear || "N/A"} />
                  <Info
                    label="Hostel Address"
                    value={selectedVolunteer.application?.hostelAddress || "Not Provided"}
                  />
                  <Info
                    label="Home Address"
                    value={selectedVolunteer.application?.homeAddress || "Not Provided"}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Reset Workflow</p>
                    <p className="text-xs text-muted-foreground">Send OTP to volunteer’s email and verify it to reset password.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                  >
                    {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send OTP
                  </button>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear OTP
                  </button>
                </div>

                {otpSent && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MailCheck className="w-4 h-4 text-emerald-600" />
                      OTP sent to volunteer’s registered email. Ask them to share it with you.
                    </p>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-input tracking-[0.4em] text-center text-lg font-semibold"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        disabled={verifying}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Verify OTP & Reset
                      </button>
                    </div>
                  </div>
                )}

                {resetPassword && (
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-emerald-700">Temporary Password Generated</p>
                    <p className="text-2xl font-bold tracking-wide text-emerald-900">{resetPassword}</p>
                    <p className="text-xs text-emerald-700">Volunteer must change this password upon next login.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 h-fit">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Security Checklist</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Confirm volunteer identity before initiating reset.</li>
                <li>• OTP expires in 10 minutes—restart if expired.</li>
                <li>• Temporary password format: first name + birth year.</li>
                <li>• Volunteer receives confirmation email automatically.</li>
                <li>• Password resets are audited under your admin ID.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-1">{value}</p>
    </div>
  )
}

