"use client"

import type { StepProps } from "@/lib/types"

export default function Step2PersonalDetails({
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

    if (!formData.nameEnglish.trim()) {
      stepErrors.nameEnglish = "Name in English is required"
    }
    if (!formData.nameHindi.trim()) {
      stepErrors.nameHindi = "Name in Hindi is required"
    }
    if (!formData.fatherName.trim()) {
      stepErrors.fatherName = "Father's name is required"
    }
    if (!formData.motherName.trim()) {
      stepErrors.motherName = "Mother's name is required"
    }
    if (!formData.dateOfBirth) {
      stepErrors.dateOfBirth = "Date of birth is required"
    }
    if (!formData.mobileNo.trim()) {
      stepErrors.mobileNo = "Mobile number is required"
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNo)) {
      stepErrors.mobileNo = "Please enter a valid 10-digit mobile number"
    }
    if (!formData.emailId.trim()) {
      stepErrors.emailId = "Email ID is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      stepErrors.emailId = "Please enter a valid email address"
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Personal Details</h2>
          <p className="text-muted-foreground">व्यक्तिगत विवरण</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nss-form-group">
          <label className="nss-form-label">
            Name (English - Capital Letters) / नाम (अंग्रेजी में बड़े अक्षरों में) <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.nameEnglish ? "border-destructive" : ""}`}
            value={formData.nameEnglish}
            onChange={(e) => handleInputChange("nameEnglish", e.target.value.toUpperCase())}
            placeholder="ENTER NAME IN CAPITAL LETTERS"
            style={{ textTransform: "uppercase" }}
          />
          {errors.nameEnglish && <p className="text-sm text-destructive">{errors.nameEnglish}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Name (Hindi) / नाम (हिंदी में) <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.nameHindi ? "border-destructive" : ""}`}
            value={formData.nameHindi}
            onChange={(e) => handleInputChange("nameHindi", e.target.value)}
            placeholder="हिंदी में नाम लिखें"
          />
          {errors.nameHindi && <p className="text-sm text-destructive">{errors.nameHindi}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Father's Name / पिता का नाम <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.fatherName ? "border-destructive" : ""}`}
            value={formData.fatherName}
            onChange={(e) => handleInputChange("fatherName", e.target.value)}
            placeholder="Enter father's name"
          />
          {errors.fatherName && <p className="text-sm text-destructive">{errors.fatherName}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Mother's Name / माता का नाम <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.motherName ? "border-destructive" : ""}`}
            value={formData.motherName}
            onChange={(e) => handleInputChange("motherName", e.target.value)}
            placeholder="Enter mother's name"
          />
          {errors.motherName && <p className="text-sm text-destructive">{errors.motherName}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Date of Birth / जन्मतिथि (DD/MM/YYYY) <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            className={`nss-form-input ${errors.dateOfBirth ? "border-destructive" : ""}`}
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          />
          {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
          <p className="text-xs text-muted-foreground mt-1">Please attach Aadhaar Card / आधार कार्ड संलग्न करें</p>
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Mobile Number / मोबाइल नंबर <span className="text-destructive">*</span>
          </label>
          <input
            type="tel"
            className={`nss-form-input ${errors.mobileNo ? "border-destructive" : ""}`}
            value={formData.mobileNo}
            onChange={(e) => handleInputChange("mobileNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
          />
          {errors.mobileNo && <p className="text-sm text-destructive">{errors.mobileNo}</p>}
        </div>

        <div className="nss-form-group md:col-span-2">
          <label className="nss-form-label">
            Email ID / ई-मेल आईडी <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            className={`nss-form-input ${errors.emailId ? "border-destructive" : ""}`}
            value={formData.emailId}
            onChange={(e) => handleInputChange("emailId", e.target.value.toLowerCase())}
            placeholder="Enter email address"
          />
          {errors.emailId && <p className="text-sm text-destructive">{errors.emailId}</p>}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onPrevious} className="nss-button-outline">
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
