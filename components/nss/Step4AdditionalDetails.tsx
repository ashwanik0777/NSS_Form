"use client"

import type { StepProps } from "@/lib/types"

export default function Step4AdditionalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  onNext,
  onPrevious,
}: StepProps) {
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleFileChange = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file })
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

  const handleNext = () => {
    const stepErrors: any = {}

    // Validation logic can be added here if needed

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
                className="nss-form-select"
                value={formData.nssEnrollmentYear}
                onChange={(e) => handleInputChange("nssEnrollmentYear", e.target.value)}
              >
                <option value="first-year">First Year / प्रथम वर्ष</option>
                <option value="second-year">Second Year / द्वितीय वर्ष</option>
              </select>
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
              <h4 className="font-medium text-foreground mb-4">Special Camp Details / विशेष शिविर विवर���</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="nss-form-group">
                  <label className="nss-form-label">Village/Urban Slum Name / गाँव/शहरी मलिन बस्ती का नाम</label>
                  <input
                    type="text"
                    className="nss-form-input"
                    value={formData.specialCampDetails?.villageName || ""}
                    onChange={(e) => handleSpecialCampChange("villageName", e.target.value)}
                    placeholder="Enter village/slum name"
                  />
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">Date / तिथि</label>
                  <input
                    type="date"
                    className="nss-form-input"
                    value={formData.specialCampDetails?.date || ""}
                    onChange={(e) => handleSpecialCampChange("date", e.target.value)}
                  />
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">Venue / स्थान</label>
                  <input
                    type="text"
                    className="nss-form-input"
                    value={formData.specialCampDetails?.venue || ""}
                    onChange={(e) => handleSpecialCampChange("venue", e.target.value)}
                    placeholder="Enter venue"
                  />
                </div>
                <div className="nss-form-group">
                  <label className="nss-form-label">Proof Certificate / प्रमाण पत्र</label>
                  <input
                    type="file"
                    className="nss-form-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSpecialCampChange("proof", e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Bharat Portal */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">My Bharat Portal Registration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="nss-form-group">
              <label className="nss-form-label">Registered on My Bharat Portal / माई भारत पोर्टल पर पंजीकृत</label>
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
            </div>

            {formData.myBharatPortalRegistered && (
              <div className="nss-form-group">
                <label className="nss-form-label">Screenshot / स्क्रीनशॉट</label>
                <input
                  type="file"
                  className="nss-form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("myBharatPortalScreenshot", e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">Attach screenshot</p>
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
                />
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
                  <label className="nss-form-label">ELP Proof / ईएलपी प्रमाण</label>
                  <input
                    type="file"
                    className="nss-form-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("elpProof", e.target.files?.[0] || null)}
                  />
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
                />
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
