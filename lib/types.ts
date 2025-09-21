export interface FormData {
  // Institution Details
  institutionName: string
  formNo?: string // Set on server only
  enrollment: "first-year" | "second-year"
  programOfficerName: string
  unitNo: string

  // Personal Details
  nameEnglish: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  mobileNo: string
  emailId: string
  departmentName: string
  gender: "male" | "female" | "other"
  category: "general" | "obc" | "st" | "sc"
  institutionalIdCard: string
  institutionalIdProof?: File | null
  photo?: File | null
  signature?: string | null // Path to student signature image (PNG)

  // Educational Details
  highSchoolRollNo: string
  classSemester: string

  // NSS enrollment details
  nssEnrollmentYear: "first-year" | "second-year"
  attendedSpecialCamp: boolean
  specialCampDetails?: {
    villageName: string
    date: string
    venue: string
    proof?: File | null
  }
  myBharatPortalRegistered: boolean
  myBharatPortalScreenshot?: File | null

  // Additional achievements section
  specialNSSAchievements?: string
  specialNSSAchievementsProof?: File | null
  attendedELP: boolean
  elpProof?: File | null
  otherAchievements?: string
  otherAchievementsCertificates?: File | null
}

export interface ValidationErrors {
  [key: string]: string
}

export interface StepProps {
  formData: FormData
  setFormData: (data: FormData) => void
  errors: ValidationErrors
  setErrors: (errors: ValidationErrors) => void
  onNext: () => void
  onPrevious: () => void
}
