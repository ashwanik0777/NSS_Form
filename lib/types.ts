export interface FormData {
  // Institution Details
  institutionName: string
  formNo: string
  enrollment: "first-year" | "second-year"
  programOfficerName: string
  unitNo: string

  // Personal Details
  nameEnglish: string
  nameHindi: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  mobileNo: string
  emailId: string

  // Educational Details
  highSchoolRollNo: string
  classSemester: string
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
