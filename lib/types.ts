export interface FormData {
  [x: string]: any

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
  schoolName: string
  departmentName: string
  courseName: string
  classSemester: string
  institutionalIdCard: string
  gender: string
  category: string
  bloodGroup: string
  photo: string | null
  signature: string | null
  addressType: "hostler" | "dayscholar" | ""
  hostelAddress?: string
  homeAddress?: string

  // Educational Details
  highSchoolRollNo: string
    highSchoolCertificate: string | null

  // NSS enrollment details
  nssEnrollmentYear: "first-year" | "second-year"
  attendedSpecialCamp: boolean
  specialCampDetails?: {
    proof: any
    villageName: string
    date: string
    venue: string
  }
  myBharatPortalRegistered: boolean
  myBharatPortalId: string | null
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
