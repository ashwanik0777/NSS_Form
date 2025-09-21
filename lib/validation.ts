import type { FormData, ValidationErrors } from "./types"

export const validateStep1 = (data: FormData): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!data.institutionName.trim()) {
    errors.institutionName = "Institution name is required"
  }

  if (!data.enrollment) {
    errors.enrollment = "Enrollment type is required"
  }

  if (!data.programOfficerName.trim()) {
    errors.programOfficerName = "Program officer name is required"
  }

  if (!data.unitNo.trim()) {
    errors.unitNo = "Unit number is required"
  }

  return errors
}

export const validateStep2 = (data: FormData): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!data.nameEnglish.trim()) {
    errors.nameEnglish = "Name in English is required"
  }


  if (!data.fatherName.trim()) {
    errors.fatherName = "Father's name is required"
  }

  if (!data.motherName.trim()) {
    errors.motherName = "Mother's name is required"
  }

  if (!data.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required"
  }

  if (!data.mobileNo.trim()) {
    errors.mobileNo = "Mobile number is required"
  } else if (!/^[6-9]\d{9}$/.test(data.mobileNo)) {
    errors.mobileNo = "Please enter a valid 10-digit mobile number"
  }

  if (!data.emailId.trim()) {
    errors.emailId = "Email ID is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailId)) {
    errors.emailId = "Please enter a valid email address"
  }

  return errors
}

export const validateStep3 = (data: FormData): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!data.highSchoolRollNo.trim()) {
    errors.highSchoolRollNo = "High school roll number is required"
  }

  if (!data.classSemester.trim()) {
    errors.classSemester = "Class/Semester is required"
  }

  return errors
}

export const validateAllSteps = (data: FormData): ValidationErrors => {
  return {
    ...validateStep1(data),
    ...validateStep2(data),
    ...validateStep3(data),
  }
}
