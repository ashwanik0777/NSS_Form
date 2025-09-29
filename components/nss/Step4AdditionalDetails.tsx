"use client"

import type { StepProps } from "@/lib/types"
import { useState } from "react"

export default function Step4AdditionalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  onNext,
  onPrevious,
}: StepProps) {
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({})

  const handleInputChange = (field: string, value: string | boolean) => {
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
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError((prev) => ({ ...prev, [field]: "File size must be less than 5MB" }))
      return
    }
    
    setUploading((prev) => ({ ...prev, [field]: true }))
    try {
      const data = new FormData()
      data.append("file", file)
      data.append("folder", "nss-documents")
      
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: data,
      })
      
      const result = await res.json()
      
      if (result.success && result.url) {
        setFormData({ ...formData, [field]: result.url })
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

  const handleSpecialCampChange = (field: string, value: string | File | null) => {
    setFormData({
      ...formData,
      specialCampDetails: {
        ...formData.specialCampDetails!,
        [field]: value,
      },
    })
  }

  const openMyBharatPortal = () => {
    window.open("https://www.mybharat.gov.in/", "_blank")
  }

  const handleNext = () => {
    const stepErrors: any = {}

    // Validate NSS Enrollment Year
    if (!formData.nssEnrollmentYear) {
      stepErrors.nssEnrollmentYear = "NSS Enrollment Year is required"
    }

    // Validate Special Camp Details if attended
    if (formData.attendedSpecialCamp === true) {
      if (!formData.specialCampDetails?.villageName?.trim()) {
        stepErrors.specialCampVillage = "Village/Urban Slum name is required"
      }
      if (!formData.specialCampDetails?.date) {
        stepErrors.specialCampDate = "Camp date is required"
      }
      if (!formData.specialCampDetails?.venue?.trim()) {
        stepErrors.specialCampVenue = "Camp venue is required"
      }
      if (!formData.specialCampProof) {
        stepErrors.specialCampProof = "Camp proof certificate is required"
      }
    }

    // Validate My Bharat Portal Registration
    if (formData.myBharatPortalRegistered === undefined || formData.myBharatPortalRegistered === null) {
      stepErrors.myBharatPortalRegistered = "Please select My Bharat Portal registration status"
    }

    if (formData.myBharatPortalRegistered === true) {
      if (!formData.myBharatPortalId?.trim()) {
        stepErrors.myBharatPortalId = "My Bharat Portal ID is required"
      }
      if (!formData.myBharatPortalScreenshot) {
        stepErrors.myBharatPortalScreenshot = "My Bharat Portal screenshot is required"
      }
    }

    // Validate ELP Proof if attended
    if (formData.attendedELP === true && !formData.elpProof) {
      stepErrors.elpProof = "ELP proof is required"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Additional Details</h2>
          <p className="text-muted-foreground">अतिरिक्त विवरण</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* NSS Enrollment Details */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">NSS Enrollment Details / एनएसएस नामांकन विवरण</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="nss-form-group">
              <label className="nss-form-label">
                NSS Enrollment Year / एनएसएस नामांकन वर्ष <span className="text-destructive">*</span>
              </label>
              <select
                className={`nss-form-select ${errors.nssEnrollmentYear ? "border-destructive" : ""}`}
                value={formData.nssEnrollmentYear}
                onChange={(e) => handleInputChange("nssEnrollmentYear", e.target.value)}
              >
                <option value="">Select Enrollment Year / वर्ष चुनें</option>
                <option value="first-year">First Year / प्रथम वर्ष</option>
                <option value="second-year">Second Year / द्वितीय वर्ष</option>
              </select>
              {errors.nssEnrollmentYear && <p className="text-sm text-destructive">{errors.nssEnrollmentYear}</p>}
            </div>

            <div className="nss-form-group">
              <label className="nss-form-label">Attended 07-Day Special Camp / 07 दिवसीय विशेष शिविर में भाग लिया</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attendedSpecialCamp"
                    checked={formData.attendedSpecialCamp === true}
                    onChange={() => handleInputChange("attendedSpecialCamp", true)}
                    className="mr-2"
                  />
                  Yes / हाँ
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attendedSpecialCamp"
                    checked={formData.attendedSpecialCamp === false}
                    onChange={() => handleInputChange("attendedSpecialCamp", false)}
                    className="mr-2"
                  />
                  No / नहीं
                </label>
              </div>
            </div>
          </div>

          {formData.attendedSpecialCamp && (
            <div className="mt-6 p-4 bg-background rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-4">Special Camp Details / विशेष शिविर विवरण</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    Village/Urban Slum Name / गाँव/शहरी मलिन बस्ती का नाम <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className={`nss-form-input ${errors.specialCampVillage ? "border-destructive" : ""}`}
                    value={formData.specialCampDetails?.villageName || ""}
                    onChange={(e) => handleSpecialCampChange("villageName", e.target.value)}
                    placeholder="Enter village/slum name"
                  />
                  {errors.specialCampVillage && <p className="text-sm text-destructive">{errors.specialCampVillage}</p>}
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    Date / तिथि <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    className={`nss-form-input ${errors.specialCampDate ? "border-destructive" : ""}`}
                    value={formData.specialCampDetails?.date || ""}
                    onChange={(e) => handleSpecialCampChange("date", e.target.value)}
                  />
                  {errors.specialCampDate && <p className="text-sm text-destructive">{errors.specialCampDate}</p>}
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    Venue / स्थान <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className={`nss-form-input ${errors.specialCampVenue ? "border-destructive" : ""}`}
                    value={formData.specialCampDetails?.venue || ""}
                    onChange={(e) => handleSpecialCampChange("venue", e.target.value)}
                    placeholder="Enter venue"
                  />
                  {errors.specialCampVenue && <p className="text-sm text-destructive">{errors.specialCampVenue}</p>}
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    Proof Certificate / प्रमाण पत्र <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="file"
                    className={`nss-form-input ${errors.specialCampProof ? "border-destructive" : ""}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("specialCampProof", e.target.files?.[0] || null)}
                    disabled={uploading.specialCampProof}
                  />
                  {uploading.specialCampProof && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  {uploadError.specialCampProof && <p className="text-xs text-destructive">{uploadError.specialCampProof}</p>}
                  {errors.specialCampProof && <p className="text-sm text-destructive">{errors.specialCampProof}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Bharat Portal */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            My Bharat Portal Registration <span className="text-destructive">*</span>
          </h3>

          <div className="space-y-6">
            <div className="nss-form-group">
              <label className="nss-form-label">
                Registered on My Bharat Portal / माई भारत पोर्टल पर पंजीकृत <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="myBharatPortalRegistered"
                    checked={formData.myBharatPortalRegistered === true}
                    onChange={() => handleInputChange("myBharatPortalRegistered", true)}
                    className="mr-2"
                  />
                  Yes / हाँ
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="myBharatPortalRegistered"
                    checked={formData.myBharatPortalRegistered === false}
                    onChange={() => handleInputChange("myBharatPortalRegistered", false)}
                    className="mr-2"
                  />
                  No / नहीं
                </label>
              </div>
              {errors.myBharatPortalRegistered && <p className="text-sm text-destructive">{errors.myBharatPortalRegistered}</p>}
            </div>

            {formData.myBharatPortalRegistered === true && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    My Bharat Portal ID / माई भारत पोर्टल आईडी <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className={`nss-form-input ${errors.myBharatPortalId ? "border-destructive" : ""}`}
                    value={formData.myBharatPortalId || ""}
                    onChange={(e) => handleInputChange("myBharatPortalId", e.target.value)}
                    placeholder="Enter My Bharat Portal ID"
                  />
                  {errors.myBharatPortalId && <p className="text-sm text-destructive">{errors.myBharatPortalId}</p>}
                </div>

                <div className="nss-form-group">
                  <label className="nss-form-label">
                    Screenshot / स्क्रीनशॉट <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="file"
                    className={`nss-form-input ${errors.myBharatPortalScreenshot ? "border-destructive" : ""}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("myBharatPortalScreenshot", e.target.files?.[0] || null)}
                    disabled={uploading.myBharatPortalScreenshot}
                  />
                  {uploading.myBharatPortalScreenshot && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  {uploadError.myBharatPortalScreenshot && <p className="text-xs text-destructive">{uploadError.myBharatPortalScreenshot}</p>}
                  {errors.myBharatPortalScreenshot && <p className="text-sm text-destructive">{errors.myBharatPortalScreenshot}</p>}
                  
                  {formData.myBharatPortalScreenshot && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-800 font-medium">Screenshot uploaded successfully!</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Attach screenshot of your My Bharat Portal profile / अपने माई भारत पोर्टल प्रोफाइल का स्क्रीनशॉट संलग्न करें
                  </p>
                </div>
              </div>
            )}

            {formData.myBharatPortalRegistered === false && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-orange-800 font-medium mb-2">Registration Required / पंजीकरण आवश्यक</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      You must register on My Bharat Portal to proceed with NSS enrollment. 
                      <br />
                      एनएसएस नामांकन के लिए आपको माई भारत पोर्टल पर पंजीकरण करना होगा।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openMyBharatPortal}
                    className="nss-button-primary flex items-center whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Register Now / अभी पंजीकरण करें
                  </button>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                  <p className="text-xs text-orange-600">
                    <strong>Instructions / निर्देश:</strong>
                    <br />
                    1. Click "Register Now" to open My Bharat Portal / "अभी पंजीकरण करें" पर क्लिक करके माई भारत पोर्टल खोलें
                    <br />
                    2. Complete your registration / अपना पंजीकरण पूरा करें
                    <br />
                    3. Take a screenshot of your profile / अपने प्रोफाइल का स्क्रीनशॉट लें
                    <br />
                    4. Come back and select "Yes" with your ID and screenshot / वापस आकर "हाँ" का चयन करें और अपनी आईडी व स्क्रीनशॉट अपलोड करें
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Achievements */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Additional Achievements / अतिरिक्त उपलब्धियाँ</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nss-form-group">
                <label className="nss-form-label">Special NSS Achievements / विशेष एनएसएस उपलब्धियाँ</label>
                <textarea
                  className="nss-form-input min-h-[100px]"
                  value={formData.specialNSSAchievements || ""}
                  onChange={(e) => handleInputChange("specialNSSAchievements", e.target.value)}
                  placeholder="राष्ट्रीय युवा शिविर / एकता शिविर / प्री-आरडी / आरडी पैरेड / राष्ट्रीय शिविर दिल्ली आमंत्रण आदि"
                />
              </div>
              <div className="nss-form-group">
                <label className="nss-form-label">Achievement Proof / उपलब्धि प्रमाण</label>
                <input
                  type="file"
                  className="nss-form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("specialNSSAchievementsProof", e.target.files?.[0] || null)}
                  disabled={uploading.specialNSSAchievementsProof}
                />
                {uploading.specialNSSAchievementsProof && <p className="text-xs text-muted-foreground">Uploading...</p>}
                <p className="text-xs text-muted-foreground mt-1">प्रत्येक शिविर का प्रमाण पत्र संलग्न करें</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nss-form-group">
                <label className="nss-form-label">
                  Attended ELP (Experiential Learning Programme) / ईएलपी में भागीदारी
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attendedELP"
                      checked={formData.attendedELP === true}
                      onChange={() => handleInputChange("attendedELP", true)}
                      className="mr-2"
                    />
                    Yes / हाँ
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attendedELP"
                      checked={formData.attendedELP === false}
                      onChange={() => handleInputChange("attendedELP", false)}
                      className="mr-2"
                    />
                    No / नहीं
                  </label>
                </div>
              </div>

              {formData.attendedELP && (
                <div className="nss-form-group">
                  <label className="nss-form-label">
                    ELP Proof / ईएलपी प्रमाण <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="file"
                    className={`nss-form-input ${errors.elpProof ? "border-destructive" : ""}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("elpProof", e.target.files?.[0] || null)}
                    disabled={uploading.elpProof}
                  />
                  {uploading.elpProof && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  {errors.elpProof && <p className="text-sm text-destructive">{errors.elpProof}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Attach proof</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nss-form-group">
                <label className="nss-form-label">Other Achievements / अन्य उपलब्धियाँ</label>
                <textarea
                  className="nss-form-input min-h-[100px]"
                  value={formData.otherAchievements || ""}
                  onChange={(e) => handleInputChange("otherAchievements", e.target.value)}
                  placeholder="शैक्षणिक / पुरस्कार / सम्मान / अन्य उपलब्धियाँ"
                />
              </div>
              <div className="nss-form-group">
                <label className="nss-form-label">Achievement Certificates / उपलब्धि प्रमाण पत्र</label>
                <input
                  type="file"
                  className="nss-form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("otherAchievementsCertificates", e.target.files?.[0] || null)}
                  disabled={uploading.otherAchievementsCertificates}
                />
                {uploading.otherAchievementsCertificates && <p className="text-xs text-muted-foreground">Uploading...</p>}
                <p className="text-xs text-muted-foreground mt-1">प्रमाणपत्र संलग्न करें</p>
              </div>
            </div>
          </div>
        </div>
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
