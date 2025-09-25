"use client"

import type { StepProps } from "@/lib/types"



export default function Step1InstitutionDetails({ formData, setFormData, errors, setErrors, onNext }: StepProps) {

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleNext = () => {
    const stepErrors: any = {}

    if (!formData.institutionName.trim()) {
      stepErrors.institutionName = "Institution name is required"
    }

    if (!formData.enrollment) {
      stepErrors.enrollment = "Enrollment type is required"
    }
    if (!formData.programOfficerName.trim()) {
      stepErrors.programOfficerName = "Program officer name is required"
    }
    if (!formData.unitNo.trim()) {
      stepErrors.unitNo = "Unit number is required"
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Institution Details</h2>
          <p className="text-muted-foreground">संस्थान का विवरण</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nss-form-group">
          <label className="nss-form-label">
            Institution Name / संस्थान का नाम <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.institutionName ? "border-destructive" : ""}`}
            value={formData.institutionName}
            onChange={(e) => handleInputChange("institutionName", e.target.value)}
            placeholder="Enter institution name"
          />
          {errors.institutionName && <p className="text-sm text-destructive">{errors.institutionName}</p>}
        </div>



        <div className="nss-form-group">
          <label className="nss-form-label">
            Enrollment / नामांकन <span className="text-destructive">*</span>
          </label>
          <select
            className={`nss-form-select ${errors.enrollment ? "border-destructive" : ""}`}
            value={formData.enrollment}
            onChange={(e) => handleInputChange("enrollment", e.target.value)}
          >
            <option value="">Select enrollment type</option>
            <option value="first-year">First Year / प्रथम वर्ष</option>
            <option value="second-year">Second Year / द्वितीय वर्ष</option>
            <option value="second-year">Third Year / तृतीय वर्ष</option>
            <option value="second-year">Fourth Year / चतुर्थ वर्ष</option>

          </select>
          {errors.enrollment && <p className="text-sm text-destructive">{errors.enrollment}</p>}
        </div>

        <div className="nss-form-group">
          <label className="nss-form-label">
            Programme Coordinator Name / कार्यक्रम समन्वयक का नाम <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.programOfficerName ? "border-destructive" : ""}`}
            value={formData.programOfficerName}
            onChange={(e) => handleInputChange("programOfficerName", e.target.value)}
            placeholder="Enter programme officer name"
          />
          {errors.programOfficerName && <p className="text-sm text-destructive">{errors.programOfficerName}</p>}
        </div>

        <div className="nss-form-group md:col-span-2">
          <label className="nss-form-label">
            Unit Number / इकाई संख्या <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={`nss-form-input ${errors.unitNo ? "border-destructive" : ""}`}
            value={formData.unitNo}
            onChange={(e) => handleInputChange("unitNo", e.target.value)}
            placeholder="Enter unit number"
          />
          {errors.unitNo && <p className="text-sm text-destructive">{errors.unitNo}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button onClick={handleNext} className="nss-button-primary ">
          Next / आगे
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
