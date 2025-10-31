"use client"

import type { StepProps } from "@/lib/types"
import { useState } from "react"

export default function Step3EducationalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  onNext,
  onPrevious,
}: StepProps) {
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleFileChange = async (field: string, file: File | null) => {
    setUploadError((prev) => ({ ...prev, [field]: "" }))
    if (!file) {
      setFormData({ ...formData, [field]: null })
      return
    }
    
    // Validate file type (only PDF, JPG, PNG allowed)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setUploadError((prev) => ({ ...prev, [field]: "Only PDF, JPG, and PNG files are allowed" }))
      return
    }
    
    // Validate file size (max 5MB for documents)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError((prev) => ({ ...prev, [field]: "File size must be less than 2MB" }))
      return
    }
    
    setUploading((prev) => ({ ...prev, [field]: true }))
    try {
      const data = new FormData()
      data.append("file", file)
      data.append("folder", "nss-documents") // Organize files in folders
      
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: data,
      })
      
      const result = await res.json()
      console.log(`Upload result for ${field}:`, result)
      
      if (result.success && result.url) {
        setFormData({ ...formData, [field]: result.url })
        console.log(`${field} uploaded successfully:`, result.url)
      } else {
        setUploadError((prev) => ({ ...prev, [field]: result.message || "Upload failed" }))
      }
    } catch (e) {
      console.error(`Upload error for ${field}:`, e)
      setUploadError((prev) => ({ ...prev, [field]: "Upload failed. Please try again." }))
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleNext = () => {
    const stepErrors: any = {}

    if (!formData.highSchoolRollNo.trim()) {
      stepErrors.highSchoolRollNo = "High school roll number is required"
    }
    if (!formData.highSchoolCertificate) {
      stepErrors.highSchoolCertificate = "High school certificate/marksheet is required"
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors({ ...errors, ...stepErrors })
      return
    }

    console.log("Step 3 form data before next:", formData)
    onNext()
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Educational Details</h2>
          <p className="text-muted-foreground">शैक्षणिक विवरण</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nss-form-group">
          <label className="nss-form-label">
            High School Roll Number / हाई स्कूल रोल नंबर <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.highSchoolRollNo ? "border-destructive" : ""}`}
            value={formData.highSchoolRollNo}
            onChange={(e) => handleInputChange("highSchoolRollNo", e.target.value)}
            placeholder="Enter high school roll number"
          />
          {errors.highSchoolRollNo && <p className="text-sm text-destructive">{errors.highSchoolRollNo}</p>}
        </div>

        <div className="nss-form-group md:col-span-2">
          <label className="nss-form-label">
            High School Certificate/Marksheet / हाई स्कूल प्रमाण पत्र/अंकसूची <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            className={`nss-form-input ${errors.highSchoolCertificate ? "border-destructive" : ""}`}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("highSchoolCertificate", e.target.files?.[0] || null)}
            disabled={uploading.highSchoolCertificate}
          />
          
          {uploading.highSchoolCertificate && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading document...
            </div>
          )}
          
          {uploadError.highSchoolCertificate && (
            <p className="text-sm text-destructive mt-1">{uploadError.highSchoolCertificate}</p>
          )}
          
          {errors.highSchoolCertificate && (
            <p className="text-sm text-destructive mt-1">{errors.highSchoolCertificate}</p>
          )}
          
          {formData.highSchoolCertificate && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800 font-medium">Document uploaded successfully!</span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <a
                  href={formData.highSchoolCertificate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View Document
                </a>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, highSchoolCertificate: null })
                    // Reset file input
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                    if (fileInput) fileInput.value = ''
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">
            Upload your 10th class certificate or marksheet (PDF, JPG, PNG format, max 2MB)
            <br />
            अपना 10वीं कक्षा का प्रमाण पत्र या अंकसूची अपलोड करें (PDF, JPG, PNG प्रारूप, अधिकतम 2MB)
          </p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Required Documents / आवश्यक दस्तावेज</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Aadhaar Card (for Date of Birth verification) / आधार कार्ड (जन्मतिथि सत्यापन के लिए)
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            High School Certificate (Mandatory - Now uploaded ✓) / हाई स्कूल प्रमाण पत्र (अनिवार्य - अब अपलोड किया गया ✓)
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Current Academic Records / वर्तमान शैक्षणिक रिकॉर्ड
          </li>
        </ul>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrevious} className="nss-button-outline flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous / पिछला
        </button>
        <button onClick={handleNext} className="nss-button-primary">
          Next / आगे
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
