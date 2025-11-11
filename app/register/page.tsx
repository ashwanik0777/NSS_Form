"use client"

import { useState, useEffect } from "react"
import type { FormData, ValidationErrors } from "@/lib/types"
import StepIndicator from "@/components/nss/StepIndicator"
import Step1InstitutionDetails from "@/components/nss/Step1InstitutionDetails"
import Step2PersonalDetails from "@/components/nss/Step2PersonalDetails"
import Step3EducationalDetails from "@/components/nss/Step3EducationalDetails"
import Step4Preview from "@/components/nss/Step5Preview"
import Step4AdditionalDetails from "@/components/nss/Step4AdditionalDetails"

const initialFormData: FormData = {
  institutionName: "Gautam Buddha University",
  enrollment: "first-year",
  programOfficerName: "",
  unitNo: "",
  nameEnglish: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  mobileNo: "",
  emailId: "",
  departmentName: "",
  gender: "male",
  category: "general",
  // categoryProof: null,
  institutionalIdCard: "",
  // institutionalIdProof: null,
  // admissionFeesReceipt: null,
  highSchoolRollNo: "",
  highSchoolCertificate: null,

  classSemester: "",
  nssEnrollmentYear: "first-year",
  attendedSpecialCamp: false,
  specialCampDetails: {
    villageName: "",
    date: "",
    venue: "",
    proof: null,
  },
  myBharatPortalRegistered: false,
  myBharatPortalScreenshot: null,
  specialNSSAchievements: "",
  specialNSSAchievementsProof: null,
  attendedELP: false,
  elpProof: null,
  otherAchievements: "",
  otherAchievementsCertificates: null,
}

const stepTitles = [
  "Institution Details",
  "Personal Details",
  "Educational & NSS Details",
  "Additional Details",
  "Review & Submit",
]

export default function RegisterPage() {
  // Restore from localStorage if present
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Restore from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("nss_formData")
    if (saved) {
      try {
        setFormData({ ...initialFormData, ...JSON.parse(saved) })
      } catch {
        setFormData(initialFormData)
      }
    }
    const savedStep = localStorage.getItem("nss_currentStep")
    if (savedStep) {
      setCurrentStep(Number(savedStep))
    }
  }, [])

  // Save formData and currentStep to localStorage on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("nss_formData", JSON.stringify(formData))
  }, [formData])
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("nss_currentStep", String(currentStep))
  }, [currentStep])
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState("")

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nss_formData", JSON.stringify(formData))
    }
  }, [formData])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nss_currentStep", String(currentStep))
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          userEmail: formData.emailId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setApplicationId(result.applicationId)
        setSubmitSuccess(true)
        // Clear localStorage on successful submit
        localStorage.removeItem("nss_formData")
        localStorage.removeItem("nss_currentStep")
      } else {
        alert("Error submitting application: " + result.message)
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      alert("Error submitting application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="nss-form-container text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Application Submitted Successfully!</h2>
            <p className="text-lg text-muted-foreground mb-6">आवेदन सफलतापूर्वक जमा किया गया!</p>
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <p className="text-foreground mb-2">
                <strong>Application ID:</strong> {applicationId}
              </p>
              <p className="text-sm text-muted-foreground">
                Please save this Application ID for future reference. You will receive an email confirmation shortly.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => window.print()} className="nss-button-secondary mr-4">
                Print Confirmation
              </button>
              <button onClick={() => (window.location.href = "/")} className="nss-button-primary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      setFormData,
      errors,
      setErrors,
      onNext: handleNext,
      onPrevious: handlePrevious,
    }

    switch (currentStep) {
      case 1:
        return <Step1InstitutionDetails {...stepProps} />
      case 2:
        return <Step2PersonalDetails {...stepProps} />
      case 3:
        return <Step3EducationalDetails {...stepProps} />
      case 4:
        return <Step4AdditionalDetails {...stepProps} />
      case 5:
        return (
          <Step4Preview
            formData={formData}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return <Step1InstitutionDetails {...stepProps} />
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mr-4">
              {/* <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg> */}
              <img src="/nssLogo.png" alt="NSS Logo" className="h-16 w-auto" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-foreground">NSS - GBU</h1>
              <p className="text-lg text-muted-foreground">राष्ट्रीय सेवा योजना - गौतम बुद्ध विश्वविद्यालय
</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Volunteer Registration / Renewal Application Form 2025-26
          </h2>
          <p className="text-muted-foreground">स्वयंसेवक पंजीकरण / नवीनीकरण आवेदन पत्र 2025-26</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={5} stepTitles={stepTitles} />

        {/* Form Container */}
        <div className="nss-form-container">{renderCurrentStep()}</div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          {/* <p>Government of India | भारत सरकार</p> */}
          <p>GBU - National Service Scheme </p>
        </div>
      </div>
    </div>
  )
}
