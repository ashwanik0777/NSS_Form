"use client"

import type { FormData } from "@/lib/types"
import { useState } from "react"

interface Step5PreviewProps {
  formData: FormData
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function Step5Preview({ formData, onPrevious, onSubmit, isSubmitting }: Step5PreviewProps) {
  const [agreed, setAgreed] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleSubmit = () => {
    if (!agreed) {
      alert("Please agree to the declaration before submitting.")
      return
    }
    onSubmit()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `NSS_Application_${formData.formNo || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  return (
    <div className="nss-form-section">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 no-print">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mr-3 sm:mr-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Application Preview</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">आवेदन पूर्वावलोकन</p>
          </div>
        </div>

        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="nss-button-secondary text-sm sm:text-base w-full sm:w-auto flex-1 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="nss-button-secondary text-sm sm:text-base w-full sm:w-auto flex-1 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download&nbsp;PDF
          </button>
        </div>
            </div>

      {/* PDF Preview Container */}
      <div className="pdf-preview-container rounded-lg overflow-x-auto">
        {/* Page 1 */}
        <div className="pdf-page bg-white shadow-lg mx-auto mb-4 sm:mb-8" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', maxWidth: '100%', transform: 'scale(1)' }}>
          {/* Header with logos */}
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-8 -ml-5 sm:-ml-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded flex items-center justify-center flex-shrink-0">
              <img src="/1.png" alt="Logo 1" className="w-full h-full object-contain" />
            </div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded flex items-center justify-center flex-shrink-0">
              <img src="/myBharatLogo.png" alt="My Bharat Logo" className="w-full h-full object-contain" />
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded flex items-center justify-center flex-shrink-0">
              <img src="/nssLogo.png" alt="NSS Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* University Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-base sm:text-lg font-bold text-blue-900 mb-1">Gautam Buddha University</h1>
            <h2 className="text-sm sm:text-md font-semibold text-blue-800 mb-2">National Service Scheme (NSS)</h2>
            <h3 className="text-base sm:text-lg font-bold">VOLUNTEER REGISTRATION FORM</h3>
          </div>

          {/* Academic Year and Form Number */}
          <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-600">
            Academic Year: 2025-26 | Form No: {formData.formNo || "N/A"}
          </div>

          {/* Institution Details */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Institution Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Institution Name:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.institutionName || "Gautam Buddha University"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Programme Officer:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.programOfficerName}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Unit Number:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  Unit {formData.unitNo}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Enrollment:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.enrollment === "first-year" ? "First Year" : 
                   formData.enrollment === "second-year" ? "Second Year" :
                   formData.enrollment === "third-year" ? "Third Year" :
                   formData.enrollment === "fourth-year" ? "Fourth Year" : formData.enrollment}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Personal Details</h3>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Left side - Personal fields */}
              <div className="flex-1 space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.nameEnglish}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Father's Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.fatherName}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Mother's Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.motherName}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Date of Birth:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formatDate(formData.dateOfBirth)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Gender:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.gender === "male" ? "Male" : formData.gender === "female" ? "Female" : "Other"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Category:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.category?.toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Mobile Number:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.mobileNo}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Email ID:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.emailId}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">School:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.schoolName}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Department:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.departmentName}
                  </div>
                </div>
                 <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Course Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.courseName}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Class/Semester:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.classSemester}
                </div>
              </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Institution I-Card:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.institutionalIdCard}
                  </div>
                </div>
               
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Blood Group:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.bloodGroup}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Hostler/Day Scholar:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.addressType === "hostler" ? "Hostler" : formData.addressType === "dayscholar" ? "Day Scholar" : ""}
                  </div>
                </div>
                {formData.addressType === "hostler" && (
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Hostel Address:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.hostelAddress}
                    </div>
                  </div>
                )}
                {formData.addressType === "dayscholar" && (
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-24 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Home Address:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.homeAddress}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Photo and Signature */}
              <div className="w-full sm:w-32 space-y-4 flex flex-row sm:flex-col items-start sm:items-center gap-4 sm:gap-0">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-28 sm:w-28 sm:h-32 border border-gray-400 bg-gray-50 flex items-center justify-center">
                    {formData.photo ? (
                      <img
                        src={typeof formData.photo === "string" ? formData.photo : "/placeholder.svg"}
                        alt="Student Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Photo</span>
                    )}
                  </div>
                </div>

                {/* Signature */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-10 sm:w-28 sm:h-12 border border-gray-400 bg-gray-50 flex items-center justify-center mb-2">
                    {formData.signature ? (
                      <img
                        src={typeof formData.signature === "string" ? formData.signature : "/placeholder.svg"}
                        alt="Student Signature"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Signature</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Student Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className="pdf-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', maxWidth: '100%', transform: 'scale(1)' }}>
          {/* Educational Details */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Educational Details</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-40 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">High School Roll No.:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.highSchoolRollNo}
                </div>
              </div>
              {/* <div className="flex">
                <span className="w-40 text-sm text-gray-600">Class/Semester:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.classSemester}
                </div>
              </div> */}
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-40 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">High School Certificate:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.highSchoolCertificate ? "✓ Uploaded" : "Not Uploaded"}
                </div>
              </div>
            </div>
          </div>

          {/* NSS Enrollment Details */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">NSS Enrollment Details</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">NSS Enrollment Year:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.nssEnrollmentYear === "first-year" ? "First Year" : "Second Year"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Attended 7-Day Camp:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.attendedSpecialCamp ? "Yes" : "No"}
                </div>
              </div>
              
              {formData.attendedSpecialCamp && formData.specialCampDetails && (
                <div className="ml-0 sm:ml-4 space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-blue-700">Special Camp Details:</p>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Village/Urban Slum:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.specialCampDetails.villageName}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Date:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formatDate(formData.specialCampDetails.date || "")}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Venue:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.specialCampDetails.venue}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Proof Certificate:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.specialCampDetails.proof ? "✓ Uploaded" : "Not Uploaded"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* My Bharat Portal Registration */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">My Bharat Portal Registration</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Registered on My Bharat Portal:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.myBharatPortalRegistered ? "Yes" : "No"}
                </div>
              </div>
              
              {formData.myBharatPortalRegistered && (
                <>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">My Bharat Portal ID:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.myBharatPortalId}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <span className="w-full sm:w-48 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Portal Screenshot:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                      {formData.myBharatPortalScreenshot ? "✓ Uploaded" : "Not Uploaded"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Achievements */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Additional Achievements</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Special NSS Achievements:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.specialNSSAchievements || "None"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Achievement Proof:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.specialNSSAchievementsProof ? "✓ Uploaded" : "Not Uploaded"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Attended ELP:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.attendedELP ? "Yes" : "No"}
                </div>
              </div>
              {formData.attendedELP && (
                <div className="flex flex-col sm:flex-row">
                  <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">ELP Proof:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                    {formData.elpProof ? "✓ Uploaded" : "Not Uploaded"}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Other Achievements:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.otherAchievements || "None"}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="w-full sm:w-32 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Other Certificates:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-xs sm:text-sm min-h-[24px]">
                  {formData.otherAchievementsCertificates ? "✓ Uploaded" : "Not Uploaded"}
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Status */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Document Upload Status</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Student Photo:</span>
                  <span className={formData.photo ? "text-green-600" : "text-red-600"}>
                    {formData.photo ? "✓ Uploaded" : "✗ Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Student Signature:</span>
                  <span className={formData.signature ? "text-green-600" : "text-red-600"}>
                    {formData.signature ? "✓ Uploaded" : "✗ Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High School Certificate:</span>
                  <span className={formData.highSchoolCertificate ? "text-green-600" : "text-red-600"}>
                    {formData.highSchoolCertificate ? "✓ Uploaded" : "✗ Missing"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {formData.myBharatPortalRegistered && (
                  <div className="flex justify-between">
                    <span>Portal Screenshot:</span>
                    <span className={formData.myBharatPortalScreenshot ? "text-green-600" : "text-red-600"}>
                      {formData.myBharatPortalScreenshot ? "✓ Uploaded" : "✗ Missing"}
                    </span>
                  </div>
                )}
                {formData.attendedSpecialCamp && (
                  <div className="flex justify-between">
                    <span>Camp Proof:</span>
                    <span className={formData.specialCampDetails?.proof ? "text-green-600" : "text-red-600"}>
                      {formData.specialCampDetails?.proof ? "✓ Uploaded" : "✗ Missing"}
                    </span>
                  </div>
                )}
                {formData.attendedELP && (
                  <div className="flex justify-between">
                    <span>ELP Proof:</span>
                    <span className={formData.elpProof ? "text-green-600" : "text-red-600"}>
                      {formData.elpProof ? "✓ Uploaded" : "✗ Missing"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Self Declaration */}
          <div className="mb-6 sm:mb-8">
            <div className="border-b-2 border-blue-600 pb-1 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-md font-bold text-blue-600">Self Declaration</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4 sm:mb-6">
              I hereby declare that all the information provided above is true to the best of my knowledge and belief.
              I understand that if any information is found to be incorrect, my enrollment may be cancelled.
            </p>
            
            {/* Signatures */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0">
              <div className="text-center">
                <div className="w-28 h-10 sm:w-36 sm:h-12 border border-gray-400 bg-gray-50 flex items-center justify-center mb-2">
                  {formData.signature ? (
                    <img
                      src={typeof formData.signature === "string" ? formData.signature : "/placeholder.svg"}
                      alt="Student Signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Signature</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Signature of Volunteer</p>
                <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString("en-IN")}</p>
              </div>
              
              <div className="text-center">
                <div className="w-28 h-10 sm:w-36 sm:h-12 border border-gray-400 bg-gray-50 flex items-center justify-center sm:ml-5 mb-2">
                  <img src="/coordinatorSign.png" alt="Coordinator Signature" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Signature of Programme Officer</p>
                <p className="text-xs text-gray-500 mt-1">{formData.programOfficerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Declaration and Submit Section - Only visible on screen */}
      <div className="no-print bg-muted/50 border border-border rounded-lg p-4 sm:p-6 mt-4 sm:mt-8">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Final Declaration / अंतिम घोषणा</h3>
        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-foreground">
          <p className="leading-relaxed">
            मैं घोषणा करता / करती हूँ कि मेरे द्वारा दी गई उपरोक्त जानकारी मेरी जानकारी और विश्वास के अनुसार सही है। मैं यह भी समझता
            / समझती हूँ कि यदि मेरे द्वारा दी गई कोई जानकारी गलत पाई जाती है, तो मेरा नामांकन रद्द कर दिया जाएगा।
          </p>
          <p className="leading-relaxed">
            I hereby declare that the information furnished above is true to the best of my knowledge and belief. I
            also understand that if any information furnished by me is found to be incorrect, my enrolment shall be
            cancelled.
          </p>
        </div>

        <div className="mt-4 sm:mt-6">
          <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring focus:ring-2 flex-shrink-0"
            />
            <span className="text-xs sm:text-sm text-foreground">
              I agree to the above declaration and confirm that all information provided is accurate and complete.
              <br />
              <span className="text-muted-foreground">
                मैं उपरोक्त घोषणा से सहमत हूँ और पुष्टि करता हूँ कि दी गई सभी जानकारी सटीक और पूर्ण है।
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons - Only visible on screen */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-4 sm:mt-8 no-print">
        <button onClick={onPrevious} className="nss-button-outline w-full sm:w-auto text-sm sm:text-base" disabled={isSubmitting}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Edit / संपादित करें
        </button>

        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className={`nss-button-primary w-full sm:w-auto text-sm sm:text-base ${!agreed || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Submit Application / आवेदन जमा करें
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .pdf-preview-container {
            background: white !important;
            padding: 0 !important;
          }
          .pdf-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            transform: scale(1) !important;
            max-width: 100% !important;
          }
          body {
            background: white !important;
          }
        }
        
        .pdf-page:last-child {
          page-break-after: auto;
        }

        /* Mobile and Tablet Responsive Styles */
        @media (max-width: 768px) {
          .pdf-page {
            transform: scale(0.85);
            transform-origin: top center;
            margin-bottom: 1rem !important;
          }
        }

        @media (max-width: 640px) {
          .pdf-page {
            transform: scale(0.75);
            transform-origin: top center;
            padding: 15mm !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .pdf-page {
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  )
}
