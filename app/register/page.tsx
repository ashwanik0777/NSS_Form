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
  schoolName: "",
  courseName: "",
  bloodGroup: "",
  photo: null,
  signature: null,
  addressType: "",
  myBharatPortalId: null
}

const stepTitles = [
  "Institution Details",
  "Personal Details",
  "Educational & NSS Details",
  "Additional Details",
  "Review & Submit",
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)

  // Restore from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      // Restore form data
      const savedFormData = localStorage.getItem("nss_formData")
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData)
          // Merge with initial data to ensure all fields exist
          setFormData({ ...initialFormData, ...parsed })
        } catch (parseError) {
          console.error("Error parsing saved form data:", parseError)
          // If parsing fails, use initial data
          setFormData(initialFormData)
        }
      }

      // Restore current step
      const savedStep = localStorage.getItem("nss_currentStep")
      if (savedStep) {
        const stepNum = Number(savedStep)
        if (stepNum >= 1 && stepNum <= 5) {
          setCurrentStep(stepNum)
        }
      }
    } catch (error) {
      console.error("Error restoring from localStorage:", error)
      // On any error, use defaults
      setFormData(initialFormData)
      setCurrentStep(1)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Helper function to sanitize form data for localStorage
  const sanitizeFormData = (data: FormData): any => {
    const sanitized: any = {}
    
    Object.keys(data).forEach((key) => {
      const value = data[key]
      
      // Skip File objects (they should be URLs after upload)
      if (value instanceof File) {
        return
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        sanitized[key] = null
        return
      }
      
      // Handle nested objects (like specialCampDetails)
      if (typeof value === "object" && !Array.isArray(value) && value.constructor === Object) {
        const nestedSanitized: any = {}
        Object.keys(value).forEach((nestedKey) => {
          const nestedValue = (value as any)[nestedKey]
          // Skip File objects in nested objects too
          if (!(nestedValue instanceof File)) {
            nestedSanitized[nestedKey] = nestedValue
          }
        })
        sanitized[key] = nestedSanitized
        return
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => {
          if (item instanceof File) return null
          return item
        })
        return
      }
      
      // Handle primitives (string, number, boolean)
      sanitized[key] = value
    })
    
    return sanitized
  }

  // Save formData to localStorage on every change (only after initialization)
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return

    try {
      const dataToSave = sanitizeFormData(formData)
      localStorage.setItem("nss_formData", JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Error saving form data to localStorage:", error)
      // If localStorage is full or unavailable, try to clear old data
      try {
        // Check if it's a quota exceeded error
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded, clearing old form data")
          localStorage.removeItem("nss_formData")
          localStorage.removeItem("nss_currentStep")
        }
      } catch (clearError) {
        console.error("Error clearing localStorage:", clearError)
      }
    }
  }, [formData, isInitialized])

  // Save currentStep to localStorage on every change (only after initialization)
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return

    try {
      localStorage.setItem("nss_currentStep", String(currentStep))
    } catch (error) {
      console.error("Error saving current step to localStorage:", error)
      // Don't throw, just log the error
    }
  }, [currentStep, isInitialized])

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
        try {
          localStorage.removeItem("nss_formData")
          localStorage.removeItem("nss_currentStep")
        } catch (error) {
          console.error("Error clearing localStorage:", error)
          // Don't fail the submission if clearing localStorage fails
        }
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

  // Warn user before leaving if form has unsaved changes
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized || submitSuccess) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if form has any meaningful data
      const hasData = 
        formData.nameEnglish || 
        formData.emailId || 
        formData.mobileNo || 
        formData.programOfficerName ||
        formData.unitNo

      if (hasData) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [formData, isInitialized, submitSuccess])

  // Show loading state while initializing from localStorage
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
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
