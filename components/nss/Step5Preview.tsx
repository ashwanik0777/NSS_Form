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
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Application Preview</h2>
            <p className="text-muted-foreground">आवेदन पूर्वावलोकन</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button onClick={handlePrint} className="nss-button-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button onClick={handleDownloadPDF} className="nss-button-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* PDF Preview Container */}
      <div className="pdf-preview-container rounded-lg">
        {/* Page 1 */}
        <div className="pdf-page bg-white shadow-lg mx-auto mb-8" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
          {/* Header with logos */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-16 h-16  rounded flex items-center justify-center">
              <img src="/1.png" alt="Logo 1" className="w-16 h-16 object-contain" />
            </div>
            <div className="w-32 h-32 rounded flex items-center justify-center">
              <img src="/myBharatLogo.png" alt="My Bharat Logo" className="w-28 h-28 object-contain" />
            </div>
            <div className="w-16 h-16  rounded flex items-center justify-center">
              <img src="/nssLogo.png" alt="NSS Logo" className="w-14 h-14 object-contain" />
            </div>
          </div>

          {/* University Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-blue-900 mb-1">Gautam Buddha University</h1>
            <h2 className="text-md font-semibold text-blue-800 mb-2">National Service Scheme (NSS)</h2>
            <h3 className="text-lg font-bold">VOLUNTEER REGISTRATION FORM</h3>
          </div>

          {/* Academic Year and Form Number */}
          <div className="mb-6 text-sm text-gray-600">
            Academic Year: 2025-26 | Form No: {formData.formNo || "N/A"}
          </div>

          {/* Institution Details */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Institution Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Institution Name:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.institutionName}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Programme Coordinator:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.programOfficerName}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Unit Number:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.unitNo}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Enrollment:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.enrollment === "first-year" ? "First Year" : "Second Year"}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Personal Details</h3>
            </div>
            
            <div className="flex gap-6">
              {/* Left side - Personal fields */}
              <div className="flex-1 space-y-3">
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.nameEnglish}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Father's Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.fatherName}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Mother's Name:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.motherName}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Date of Birth:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formatDate(formData.dateOfBirth)}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Mobile Number:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.mobileNo}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Email ID:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.emailId}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Department:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.departmentName}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Gender:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.gender === "male" ? "Male" : formData.gender === "female" ? "Female" : "Other"}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Category:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.category?.toUpperCase()}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-600">Institution I-Card No.:</span>
                  <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                    {formData.institutionalIdCard}
                  </div>
                </div>
              </div>

              {/* Right side - Photo and Signature */}
              <div className="w-32 space-y-4">
                {/* Photo */}
                <div>
                  <div className="w-28 h-32 border border-gray-400 bg-gray-50 flex items-center justify-center">
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
                <div>
                  <div className="w-28 h-12 border border-gray-400 bg-gray-50 flex items-center justify-center mb-2">
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
        <div className="pdf-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
          {/* Educational Details */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Educational Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-40 text-sm text-gray-600">High School Roll No.:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.highSchoolRollNo}
                </div>
              </div>
              <div className="flex">
                <span className="w-40 text-sm text-gray-600">Class/Semester:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.classSemester}
                </div>
              </div>
            </div>
          </div>

          {/* NSS Enrollment Details */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">NSS Enrollment Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">NSS Enrollment Year:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.nssEnrollmentYear === "first-year" ? "First Year" : "Second Year"}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Attended 7-Day Camp:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.attendedSpecialCamp ? "Yes" : "No"}
                </div>
              </div>
              
              {formData.attendedSpecialCamp && formData.specialCampDetails && (
                <div className="ml-4 space-y-2">
                  <p className="text-sm font-medium text-blue-700">Special Camp Details:</p>
                  <div className="flex">
                    <span className="w-48 text-sm text-gray-600">Village/Urban Slum Name:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                      {formData.specialCampDetails.villageName}
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-48 text-sm text-gray-600">Date:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                      {formatDate(formData.specialCampDetails.date)}
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-48 text-sm text-gray-600">Venue:</span>
                    <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                      {formData.specialCampDetails.venue}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* My Bharat Portal Registration */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">My Bharat Portal Registration</h3>
            </div>
            <div className="flex">
              <span className="w-48 text-sm text-gray-600">Registered on My Bharat Portal:</span>
              <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                {formData.myBharatPortalRegistered ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* Additional Achievements */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Additional Achievements</h3>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">NSS Achievements:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.specialNSSAchievements}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Attended ELP:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.attendedELP ? "Yes" : "No"}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Other Achievements:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.otherAchievements}
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Address Details</h3>
            </div>
            {/* <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Permanent Add.:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.permanentAddress}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Correspondence Add.:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {formData.correspondenceAddress}
                </div>
              </div>
            </div> */}
          </div>

          {/* Emergency Contact */}
          <div className="mb-6">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Emergency Contact</h3>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Contact Person:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {/* {formData.emergencyPerson} */}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Relation:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {/* {formData.emergencyRelation} */}
                </div>
              </div>
              <div className="flex">
                <span className="w-32 text-sm text-gray-600">Contact Number:</span>
                <div className="flex-1 border border-gray-300 px-2 py-1 text-sm min-h-[24px]">
                  {/* {formData.emergencyContact} */}
                </div>
              </div>
            </div>
          </div>

          {/* Self Declaration */}
          <div className="mb-8">
            <div className="border-b-2 border-blue-600 pb-1 mb-4">
              <h3 className="text-md font-bold text-blue-600">Self Declaration</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              I hereby declare that all the information provided above is true to the best of my knowledge.
            </p>
            
            {/* Signatures */}
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-36 h-12 border border-gray-400 bg-gray-50 flex items-center justify-center mb-2">
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
                <p className="text-sm text-gray-600">Signature of Volunteer</p>
              </div>
              
              <div className="text-center">
                <div className="w-36 h-12 border border-gray-400 bg-gray-50 flex items-center justify-center mb-2">
                  <img src="/coordinatorSign.png" alt="Coordinator Signature" className="w-full h-full object-contain" />
                </div>
                <p className="text-sm text-gray-600">Signature of Programme Coordinator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Declaration and Submit Section - Only visible on screen */}
      <div className="no-print bg-muted/50 border border-border rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Final Declaration / अंतिम घोषणा</h3>
        <div className="space-y-4 text-sm text-foreground">
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

        <div className="mt-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring focus:ring-2"
            />
            <span className="text-sm text-foreground">
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
      <div className="flex justify-between mt-8 no-print">
        <button onClick={onPrevious} className="nss-button-outline" disabled={isSubmitting}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Edit / संपादित करें
        </button>

        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className={`nss-button-primary ${!agreed || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
          }
          body {
            background: white !important;
          }
        }
        
        .pdf-page:last-child {
          page-break-after: auto;
        }
      `}</style>
    </div>
  )
}
