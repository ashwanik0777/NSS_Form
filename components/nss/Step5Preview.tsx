"use client"

import type { FormData } from "@/lib/types"
import { useState } from "react"

interface Step4PreviewProps {
  formData: FormData
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function Step4Preview({ formData, onPrevious, onSubmit, isSubmitting }: Step4PreviewProps) {
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


  return (
    <div className="nss-form-section">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Review & Submit</h2>
          <p className="text-muted-foreground">समीक्षा और जमा करें</p>
        </div>
      </div>

      {/* Preview Content */}
      <div className="space-y-8">
        {/* Institution Details */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Institution Details / संस्थान का विवरण
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Institution Name</p>
              <p className="font-medium text-foreground">{formData.institutionName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Form Number</p>
              <p className="font-medium text-foreground">{formData.formNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrollment</p>
              <p className="font-medium text-foreground">
                {formData.enrollment === "first-year" ? "First Year / प्रथम वर्ष" : "Second Year / द्वितीय वर्ष"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Programme Coordinator</p>
              <p className="font-medium text-foreground">{formData.programOfficerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit Number</p>
              <p className="font-medium text-foreground">{formData.unitNo}</p>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Personal Details / व्यक्तिगत विवरण
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Student Photo</p>
              <div className="mt-2">
                {formData.photo ? (
                  <img
                    src={typeof formData.photo === "string" ? formData.photo : "/placeholder.svg"}
                    alt="Student Photo"
                    className="w-32 h-40 object-cover border border-border rounded-lg"
                  />
                ) : (
                  <img
                    src="/placeholder.svg"
                    alt="No Photo"
                    className="w-32 h-40 object-cover border border-border rounded-lg"
                  />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name (English)</p>
              <p className="font-medium text-foreground">{formData.nameEnglish}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Father's Name</p>
              <p className="font-medium text-foreground">{formData.fatherName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mother's Name</p>
              <p className="font-medium text-foreground">{formData.motherName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium text-foreground">{formatDate(formData.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile Number</p>
              <p className="font-medium text-foreground">{formData.mobileNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email ID</p>
              <p className="font-medium text-foreground">{formData.emailId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium text-foreground">{formData.departmentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium text-foreground">
                {formData.gender === "male"
                  ? "Male / पुरुष"
                  : formData.gender === "female"
                    ? "Female / महिला"
                    : "Other / अन्य"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium text-foreground">
                {formData.category === "general"
                  ? "General / सामान्य"
                  : formData.category === "obc"
                    ? "OBC / अन्य पिछड़ा वर्ग"
                    : formData.category === "st"
                      ? "ST / अनुसूचित जनजाति"
                      : "SC / अनुसूचित जाति"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Institutional I-Card Number</p>
              <p className="font-medium text-foreground">{formData.institutionalIdCard}</p>
            </div>
          </div>
        </div>

        {/* Educational Details */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Educational Details / शैक्षणिक विवरण
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">High School Roll Number</p>
              <p className="font-medium text-foreground">{formData.highSchoolRollNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class/Semester</p>
              <p className="font-medium text-foreground">{formData.classSemester}</p>
            </div>
          </div>
        </div>

        {/* NSS Enrollment & Additional Details */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            NSS & Additional Details / एनएसएस और अतिरिक्त विवरण
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">NSS Enrollment Year</p>
              <p className="font-medium text-foreground">
                {formData.nssEnrollmentYear === "first-year" ? "First Year / प्रथम वर्ष" : "Second Year / द्वितीय वर्ष"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attended 07-Day Special Camp</p>
              <p className="font-medium text-foreground">{formData.attendedSpecialCamp ? "Yes / हाँ" : "No / नहीं"}</p>
            </div>
            {formData.attendedSpecialCamp && formData.specialCampDetails && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Village/Urban Slum Name</p>
                  <p className="font-medium text-foreground">{formData.specialCampDetails.villageName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Camp Date</p>
                  <p className="font-medium text-foreground">{formatDate(formData.specialCampDetails.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Camp Venue</p>
                  <p className="font-medium text-foreground">{formData.specialCampDetails.venue}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-muted-foreground">My Bharat Portal Registration</p>
              <p className="font-medium text-foreground">{formData.myBharatPortalRegistered ? "Yes / हाँ" : "No / नहीं"}</p>
            </div>
            {formData.specialNSSAchievements && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Special NSS Achievements</p>
                <p className="font-medium text-foreground">{formData.specialNSSAchievements}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Attended ELP (Experiential Learning Programme)</p>
              <p className="font-medium text-foreground">{formData.attendedELP ? "Yes / हाँ" : "No / नहीं"}</p>
            </div>
            {formData.otherAchievements && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Other Achievements</p>
                <p className="font-medium text-foreground">{formData.otherAchievements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Declaration */}
        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Declaration / घोषणा</h3>
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

        {/* Student Signature Box below Declaration */}
        <div className="mt-8 flex flex-col items-start">
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground mb-1">Student Signature / छात्र के हस्ताक्षर</span>
            <div className="border border-border rounded-lg bg-white w-48 h-20 flex items-center justify-center">
              {formData.signature ? (
                <img
                  src={typeof formData.signature === "string" ? formData.signature : "/placeholder.svg"}
                  alt="Student Signature"
                  className="max-h-16 max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">No signature uploaded</span>
              )}
            </div>
          </div>
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
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button onClick={onPrevious} className="nss-button-outline" disabled={isSubmitting}>
          <svg className="w-4 h-4 mr-2 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Edit / संपादित करें
        </button>

        <div className="flex space-x-3">
          <button onClick={() => window.print()} className="nss-button-secondary" disabled={isSubmitting}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Preview / प्रिंट पूर्वावलोकन
          </button>

          <button
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            className={`nss-button-primary ${!agreed || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Application / आवेदन जमा करें
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
