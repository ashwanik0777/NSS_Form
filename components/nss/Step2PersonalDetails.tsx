"use client"


import type { StepProps } from "@/lib/types"
import { useState } from "react"

export default function Step2PersonalDetails({
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
    setUploading((prev) => ({ ...prev, [field]: true }))
    try {
      const data = new FormData()
      data.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      })
      const result = await res.json()
      if (result.success && result.path) {
        setFormData({ ...formData, [field]: result.path })
      } else {
        setUploadError((prev) => ({ ...prev, [field]: result.message || "Upload failed" }))
      }
    } catch (e) {
      setUploadError((prev) => ({ ...prev, [field]: "Upload failed" }))
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleNext = () => {
    const stepErrors: any = {}

    if (!formData.nameEnglish.trim()) {
      stepErrors.nameEnglish = "Name in English is required"
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
    if (!formData.departmentName.trim()) {
      stepErrors.departmentName = "Department name is required"
    }
    if (!formData.gender) {
      stepErrors.gender = "Gender is required"
    }
    if (!formData.category) {
      stepErrors.category = "Category is required"
    }
    if (!formData.institutionalIdCard.trim()) {
      stepErrors.institutionalIdCard = "Institutional I-Card number is required"
    }
    if (!formData.photo) {
      stepErrors.photo = "Student photo is required"
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

        <div className="nss-form-group md:col-span-2">
          <label className="nss-form-label">
            Student Photo / छात्र की फोटो <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            className={`nss-form-input ${errors.photo ? "border-destructive" : ""}`}
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
            disabled={uploading.photo}
          />
          {uploading.photo && <p className="text-xs text-muted-foreground">Uploading...</p>}
          {uploadError.photo && <p className="text-xs text-destructive">{uploadError.photo}</p>}
          {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
          <p className="text-xs text-muted-foreground mt-1">Upload passport size photo (JPG/PNG format, max 2MB)</p>
        </div>

        <div className="nss-form-group md:col-span-2">
          <label className="nss-form-label">
            Student Signature / छात्र के हस्ताक्षर <span className="text-destructive">*</span>
          </label>
          <input
            type="file"
            className={`nss-form-input ${errors.signature ? "border-destructive" : ""}`}
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange("signature", e.target.files?.[0] || null)}
            disabled={uploading.signature}
          />
          {uploading.signature && <p className="text-xs text-muted-foreground">Uploading...</p>}
          {uploadError.signature && <p className="text-xs text-destructive">{uploadError.signature}</p>}
          {errors.signature && <p className="text-sm text-destructive">{errors.signature}</p>}
          <p className="text-xs text-muted-foreground mt-1">Upload your signature (JPG/PNG format, max 2MB)</p>
  </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Name (Capital Letters) / नाम (बड़े अक्षरों में) <span className="text-destructive">*</span>
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

        <div className="nss-form-group">
          <label className="nss-form-label">
            Department & Name of Institution / विभाग और संस्थान का नाम <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.departmentName ? "border-destructive" : ""}`}
            value={formData.departmentName}
            onChange={(e) => handleInputChange("departmentName", e.target.value)}
            placeholder="Enter department name"
          />
          {errors.departmentName && <p className="text-sm text-destructive">{errors.departmentName}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Gender / लिंग <span className="text-destructive">*</span>
          </label>
          <select
            className={`nss-form-select ${errors.gender ? "border-destructive" : ""}`}
            value={formData.gender}
            onChange={(e) => handleInputChange("gender", e.target.value)}
          >
            <option value="">Select Gender / लिंग चुनें</option>
            <option value="male">Male / पुरुष</option>
            <option value="female">Female / महिला</option>
            <option value="other">Other / अन्य</option>
          </select>
          {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Category / वर्ग <span className="text-destructive">*</span>
          </label>
          <select
            className={`nss-form-select ${errors.category ? "border-destructive" : ""}`}
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
          >
            <option value="">Select Category / वर्ग चुनें</option>
            <option value="general">General / सामान्य</option>
            <option value="obc">OBC / अन्य पिछड़ा वर्ग</option>
            <option value="st">ST / अनुसूचित जनजाति</option>
            <option value="sc">SC / अनुसूचित जाति</option>
          </select>
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Institutional I-Card Number / संस्थान का पहचान पत्र संख्या <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.institutionalIdCard ? "border-destructive" : ""}`}
            value={formData.institutionalIdCard}
            onChange={(e) => handleInputChange("institutionalIdCard", e.target.value)}
            placeholder="Enter I-Card number"
          />
          {errors.institutionalIdCard && <p className="text-sm text-destructive">{errors.institutionalIdCard}</p>}
        </div>

  {/* I-Card Proof upload removed as per requirements */}
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
