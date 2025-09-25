import { PDFDocument, PDFPage, rgb } from "pdf-lib"
import fs from "fs"
import path from "path"

interface SpecialCampDetails {
  villageName?: string
  date?: string
  venue?: string
  proof?: Buffer
}

interface FormData {
  formNo?: string
  institutionName?: string
  programOfficerName?: string
  unitNo?: string
  enrollment?: string
  photo?: string
  nameEnglish?: string
  fatherName?: string
  motherName?: string
  dateOfBirth?: string
  emailId?: string
  departmentName?: string
  mobileNo?: string
  gender?: string
  category?: string
  signature?: string
  institutionalIdCard?: string
  highSchoolRollNo?: string
  classSemester?: string
  // Step 4
  nssEnrollmentYear?: string
  attendedSpecialCamp?: boolean
  specialCampDetails?: SpecialCampDetails
  myBharatPortalRegistered?: boolean
  myBharatPortalScreenshot?: Buffer
  specialNSSAchievements?: string
  specialNSSAchievementsProof?: Buffer
  attendedELP?: boolean
  elpProof?: Buffer
  otherAchievements?: string
  otherAchievementsCertificates?: Buffer
  // Address & Emergency (if any)
  permanentAddress?: string
  correspondenceAddress?: string
  emergencyPerson?: string
  emergencyRelation?: string
  emergencyContact?: string
}

function drawSectionHeader(page: PDFPage, text: string, y: number) {
  page.drawText(text, {
    x: 55,
    y,
    size: 14,
    color: rgb(0.1, 0.2, 0.6),
  })
  page.drawLine({
    start: { x: 55, y: y - 5 },
    end: { x: 540, y: y - 5 },
    thickness: 1,
    color: rgb(0.1, 0.2, 0.6),
  })
}

function drawField(page: PDFPage, label: string, value: string | undefined, x: number, y: number, width = 220) {
  page.drawText(label + ":", { x, y, size: 11, color: rgb(0.2, 0.2, 0.2) })
  page.drawRectangle({
    x: x + 110,
    y: y - 2,
    width,
    height: 18,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
    color: rgb(1, 1, 1),
  })
  if (value) {
    page.drawText(String(value), {
      x: x + 115,
      y: y + 2,
      size: 10,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  return y - 30
}

function drawText(page: PDFPage, text: string, x: number, y: number, size = 12, options = {}) {
  page.drawText(text, {
    x,
    y,
    size,
    ...options,
  })
}

function drawCenteredText(page: PDFPage, text: string, y: number, size = 14, options = {}) {
  const { width } = page.getSize()
  const textWidth = text.length * size * 0.6
  const x = (width - textWidth) / 2
  page.drawText(text, { x, y, size, color: rgb(0, 0, 0), ...options })
}

function loadImage(filePath: string) {
  const absPath = path.join(process.cwd(), filePath)
  return fs.readFileSync(absPath)
}

export async function generateNSSApplicationPDF(formData: FormData) {
  const pdfDoc = await PDFDocument.create()

  // Load logos
  const logo1 = await pdfDoc.embedPng(loadImage("public/1.png"))
  const logo2 = await pdfDoc.embedPng(loadImage("public/myBharatLogo.png"))
  const logo3 = await pdfDoc.embedPng(loadImage("public/nssLogo.png"))

  // ---------------- PAGE 1 ----------------
  const page1 = pdfDoc.addPage([595, 842])
  let currentY = 820

  // Top logos
  if (logo1) page1.drawImage(logo1, { x: 40, y: 790, width: 45, height: 45 })
  if (logo2) page1.drawImage(logo2, { x: 275, y: 790, width: 45, height: 45 })
  if (logo3) page1.drawImage(logo3, { x: 510, y: 790, width: 45, height: 45 })

  drawCenteredText(page1, "Gautam Buddha University", 770, 14, { color: rgb(0.1, 0.1, 0.4) })
  drawCenteredText(page1, "National Service Scheme (NSS)", 750, 13, { color: rgb(0.1, 0.1, 0.4)})
  drawCenteredText(page1, "VOLUNTEER REGISTRATION FORM", 720, 16, { color: rgb(0, 0, 0) })

  drawText(
    page1,
    `Academic Year: 2025-26   |   Form No: ${formData.formNo || "N/A"}`,
    55,
    700,
    11,
    { color: rgb(0.2, 0.2, 0.3) }
  )

  // Institution Details
  currentY = 660
  drawSectionHeader(page1, "Institution Details", currentY)
  currentY -= 25
  currentY = drawField(page1, "Institution Name", formData.institutionName, 55, currentY)
  currentY = drawField(page1, "Programme Coordinator", formData.programOfficerName, 55, currentY)
  currentY = drawField(page1, "Unit Number", formData.unitNo, 55, currentY)
  currentY = drawField(page1, "Enrollment", formData.enrollment, 55, currentY)

  // Personal Details
  currentY -= 20
  drawSectionHeader(page1, "Personal Details", currentY)
  currentY -= 25

  // Student Photo (right side)
  if (formData.photo) {
    try {
      // Convert base64 string to buffer
      const photoBuffer = Buffer.from(formData.photo.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')
      
      let photoImg
      try {
      photoImg = await pdfDoc.embedJpg(photoBuffer)
      } catch {
      photoImg = await pdfDoc.embedPng(photoBuffer)
      }
      page1.drawRectangle({
      x: 420,
      y: currentY - 110,
      width: 100,
      height: 120,
      borderWidth: 1,
      borderColor: rgb(0.6, 0.6, 0.6),
      })
      page1.drawImage(photoImg, { x: 425, y: currentY - 105, width: 90, height: 110 })
    } catch (err) {
      console.error("Photo embed error:", err)
      page1.drawRectangle({
      x: 420,
      y: currentY - 110,
      width: 100,
      height: 120,
      borderWidth: 1,
      borderColor: rgb(0.6, 0.6, 0.6),
      })
      drawText(page1, "Photo", 445, currentY - 60, 12, { color: rgb(0.5, 0.5, 0.5) })
    }
  }

  // Personal Fields (left side)
  currentY = drawField(page1, "Name", formData.nameEnglish, 55, currentY)
  currentY = drawField(page1, "Father's Name", formData.fatherName, 55, currentY)
  currentY = drawField(page1, "Mother's Name", formData.motherName, 55, currentY)
  currentY = drawField(page1, "Date of Birth", formData.dateOfBirth, 55, currentY)
  currentY = drawField(page1, "Mobile Number", formData.mobileNo, 55, currentY)
  currentY = drawField(page1, "Email ID", formData.emailId, 55, currentY)
  currentY = drawField(page1, "Department", formData.departmentName, 55, currentY)
  currentY = drawField(page1, "Gender", formData.gender, 55, currentY)
  currentY = drawField(page1, "Category", formData.category, 55, currentY)
  currentY = drawField(page1, "Institution I-Card No.", formData.institutionalIdCard, 55, currentY)

  // Student Signature
  if (formData.signature) {
    try {
      const signImg = await pdfDoc.embedPng(formData.signature)
      page1.drawImage(signImg, { x: 420, y: currentY - 60, width: 100, height: 40 })
      drawText(page1, "Student Signature", 425, currentY - 70, 10, { color: rgb(0.2, 0.2, 0.2) })
    } catch {
      drawText(page1, "[Signature Missing]", 425, currentY - 50, 10, { color: rgb(0.5, 0.5, 0.5) })
    }
  }

  // ---------------- PAGE 2 ----------------
  const page2 = pdfDoc.addPage([595, 842])
  let y2 = 800

  // Educational Details
  drawSectionHeader(page2, "Educational Details", y2)
  y2 -= 25
  y2 = drawField(page2, "High School Roll No.", formData.highSchoolRollNo, 55, y2, 300)
  y2 = drawField(page2, "Class/Semester", formData.classSemester, 55, y2, 300)

  y2 -= 20
  drawSectionHeader(page2, "NSS Enrollment Details", y2)
  y2 -= 25
  y2 = drawField(page2, "NSS Enrollment Year", formData.nssEnrollmentYear, 55, y2)
  y2 = drawField(page2, "Attended 7-Day Camp", formData.attendedSpecialCamp ? "Yes" : "No", 55, y2)
  if (formData.attendedSpecialCamp && formData.specialCampDetails) {
    y2 -= 10
    drawText(page2, "Special Camp Details:", 65, y2, 11, { color: rgb(0.2, 0.2, 0.5) })
    y2 -= 20
    y2 = drawField(page2, "Village/Urban Slum Name", formData.specialCampDetails.villageName, 75, y2, 250)
    y2 = drawField(page2, "Date", formData.specialCampDetails.date, 75, y2, 150)
    y2 = drawField(page2, "Venue", formData.specialCampDetails.venue, 75, y2, 200)
    if (formData.specialCampDetails.proof) {
      drawText(page2, "Proof Certificate: [Attached]", 75, y2, 10, { color: rgb(0.1, 0.5, 0.1) })
      y2 -= 20
    }
  }

  y2 -= 10
  drawSectionHeader(page2, "My Bharat Portal Registration", y2)
  y2 -= 25
  y2 = drawField(page2, "Registered on My Bharat Portal", formData.myBharatPortalRegistered ? "Yes" : "No", 55, y2)
  if (formData.myBharatPortalRegistered && formData.myBharatPortalScreenshot) {
    drawText(page2, "Screenshot: [Attached]", 85, y2, 10, { color: rgb(0.1, 0.5, 0.1) })
    y2 -= 20
  }

  y2 -= 10
  drawSectionHeader(page2, "Additional Achievements", y2)
  y2 -= 25
  y2 = drawField(page2, "NSS Achievements", formData.specialNSSAchievements, 55, y2, 350)
  if (formData.specialNSSAchievementsProof) {
    drawText(page2, "Achievement Proof: [Attached]", 75, y2, 10, { color: rgb(0.1, 0.5, 0.1) })
    y2 -= 20
  }
  y2 = drawField(page2, "Attended ELP", formData.attendedELP ? "Yes" : "No", 55, y2)
  if (formData.attendedELP && formData.elpProof) {
    drawText(page2, "ELP Proof: [Attached]", 75, y2, 10, { color: rgb(0.1, 0.5, 0.1) })
    y2 -= 20
  }
  y2 = drawField(page2, "Other Achievements", formData.otherAchievements, 55, y2, 350)
  if (formData.otherAchievementsCertificates) {
    drawText(page2, "Achievement Certificates: [Attached]", 75, y2, 10, { color: rgb(0.1, 0.5, 0.1) })
    y2 -= 20
  }

  y2 -= 10
  drawSectionHeader(page2, "Address Details", y2)
  y2 -= 25
  y2 = drawField(page2, "Permanent Add.", formData.permanentAddress, 55, y2, 400)
  y2 = drawField(page2, "Correspondence Add.", formData.correspondenceAddress, 55, y2, 400)

  y2 -= 20
  drawSectionHeader(page2, "Emergency Contact", y2)
  y2 -= 25
  y2 = drawField(page2, "Contact Person", formData.emergencyPerson, 55, y2)
  y2 = drawField(page2, "Relation", formData.emergencyRelation, 55, y2)
  y2 = drawField(page2, "Contact Number", formData.emergencyContact, 55, y2)

  // Self Declaration at the end
  y2 -= 30
  drawSectionHeader(page2, "Self Declaration", y2)
  y2 -= 40
  drawText(
    page2,
    "I hereby declare that all the information provided above is true to the best of my knowledge.",
    55,
    y2,
    11,
    { color: rgb(0.2, 0.2, 0.2) }
  )

  y2 -= 60
  drawText(page2, "Signature of Volunteer", 55, y2, 11)
  drawText(page2, "Signature of Programme Coordinator", 320, y2, 11)

  return await pdfDoc.save()
}
