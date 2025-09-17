"use client"

import type { StepProps } from "@/lib/types"

export default function Step3EducationalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  onNext,
  onPrevious,
}: StepProps) {
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleNext = () => {
    const stepErrors: any = {}

    if (!formData.highSchoolRollNo.trim()) {
      stepErrors.highSchoolRollNo = "High school roll number is required"
    }
    if (!formData.classSemester.trim()) {
      stepErrors.classSemester = "Class/Semester is required"
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors({ ...errors, ...stepErrors })
      return
    }

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
          <p className="text-xs text-muted-foreground mt-1">
            High School Certificate (Attach Copy) - Mandatory for all volunteers / हाई स्कूल उत्तीर्ण प्रमाण पत्र (संलग्न करें) -
            सभी स्वयंसेवकों के लिए अनिवार्य
          </p>
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Class/Semester / कक्षा/सेमेस्टर <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.classSemester ? "border-destructive" : ""}`}
            value={formData.classSemester}
            onChange={(e) => handleInputChange("classSemester", e.target.value)}
            placeholder="Enter current class/semester"
          />
          {errors.classSemester && <p className="text-sm text-destructive">{errors.classSemester}</p>}
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
            High School Certificate (Mandatory) / हाई स्कूल प्रमाण पत्र (अनिवार्य)
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
          Review & Submit / समीक्षा और जमा करें
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
