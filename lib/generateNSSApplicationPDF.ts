import { PDFDocument, rgb } from "pdf-lib"
import fs from "fs"
import path from "path"

interface SpecialCampDetails {
  villageName?: string
  date?: string
  venue?: string
}

interface FormData {
  formNo?: string
  institutionName?: string
  programOfficerName?: string
  unitNo?: string
  enrollment?: string
  schoolName?: string

  photo?: string
  nameEnglish?: string
  fatherName?: string
  motherName?: string
  dateOfBirth?: string
  mobileNo?: string
  emailId?: string
  departmentName?: string
  courseName?: string
  classSemester?: string
  bloodGroup?: string
  gender?: string
  category?: string
  institutionalIdCard?: string
  signature?: string

  highSchoolRollNo?: string
  highSchoolCertificate?: any

  nssEnrollmentYear?: string
  attendedSpecialCamp?: boolean
  specialCampDetails?: SpecialCampDetails
  myBharatPortalRegistered?: boolean
  specialNSSAchievements?: string
  attendedELP?: boolean
  otherAchievements?: string

  addressType?: "hostler" | "dayscholar" | string
  hostelAddress?: string
  homeAddress?: string
}

function loadLocalFile(relPath: string) {
  return fs.readFileSync(path.join(process.cwd(), relPath))
}

function formatDate(dateString?: string) {
  if (!dateString) return ""
  const d = new Date(dateString)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatEnrollment(enrollment?: string) {
  if (!enrollment) return ""
  if (enrollment === "first-year") return "First Year"
  if (enrollment === "second-year") return "Second Year"
  return enrollment
}

function formatGender(g?: string) {
  if (!g) return ""
  if (g === "male") return "Male"
  if (g === "female") return "Female"
  if (g === "other") return "Other"
  return g
}

// Try to convert data URI / remote URL / local path to Buffer
async function imageToBuffer(src?: string): Promise<Buffer | null> {
  if (!src) return null
  try {
    if (src.startsWith("data:image/")) {
      const base64 = src.split(",")[1] || ""
      return Buffer.from(base64, "base64")
    }
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await fetch(src)
      if (!res.ok) return null
      const ab = await res.arrayBuffer()
      return Buffer.from(ab)
    }
    // treat as local (relative to project root or public/)
    const p = src.startsWith("/") ? path.join(process.cwd(), "public", src) : path.join(process.cwd(), src)
    if (fs.existsSync(p)) return fs.readFileSync(p)
  } catch (e) {
    console.error("imageToBuffer error:", e)
  }
  return null
}

function drawHeaderLine(page: any, text: string, y: number) {
  page.drawText(text, { x: 55, y, size: 14, color: rgb(0.08, 0.18, 0.45) })
  page.drawLine({ start: { x: 55, y: y - 5 }, end: { x: 540, y: y - 5 }, thickness: 2, color: rgb(0.08, 0.18, 0.45) })
}

function drawField(page: any, label: string, value?: string, x = 55, y = 0, labelWidth = 110, fieldWidth = 360) {
  page.drawText(label + ":", { x, y, size: 10, color: rgb(0.3, 0.3, 0.3) })
  page.drawRectangle({ x: x + labelWidth, y: y - 4, width: fieldWidth, height: 18, borderWidth: 1, borderColor: rgb(0.75, 0.75, 0.75), color: rgb(1, 1, 1) })
  if (value) page.drawText(String(value), { x: x + labelWidth + 6, y: y + 1, size: 9, color: rgb(0.08, 0.08, 0.08) })
  return y - 24
}

export async function generateNSSApplicationPDF(formData: FormData) {
  const pdfDoc = await PDFDocument.create()

  // try embed logos
  let logo1: any = null, logo2: any = null, logo3: any = null
  try { logo1 = await pdfDoc.embedPng(loadLocalFile("public/1.png")) } catch {}
  try { logo2 = await pdfDoc.embedPng(loadLocalFile("public/myBharatLogo.png")) } catch {}
  try { logo3 = await pdfDoc.embedPng(loadLocalFile("public/nssLogo.png")) } catch {}

  // PAGE 1
  const page1 = pdfDoc.addPage([595, 842])
  let y = 800

  if (logo1) page1.drawImage(logo1, { x: 55, y: 760, width: 40, height: 40 })
  if (logo2) page1.drawImage(logo2, { x: 277, y: 760, width: 48, height: 48 })
  if (logo3) page1.drawImage(logo3, { x: 500, y: 760, width: 40, height: 40 })

  page1.drawText("Gautam Buddha University", { x: 170, y: 745, size: 14, color: rgb(0.08, 0.08, 0.2) })
  page1.drawText("National Service Scheme (NSS)", { x: 170, y: 726, size: 12, color: rgb(0.08, 0.08, 0.2) })
  page1.drawText("VOLUNTEER REGISTRATION FORM", { x: 170, y: 705, size: 14, color: rgb(0, 0, 0) })
  page1.drawText(`Academic Year: 2025-26 | Form No: ${formData.formNo || "N/A"}`, { x: 55, y: 680, size: 10, color: rgb(0.35, 0.35, 0.35) })

  // Institution details
  y = 650
  drawHeaderLine(page1, "Institution Details", y)
  y -= 32
  y = drawField(page1, "Institution Name", formData.institutionName, 55, y, 130, 360)
  y = drawField(page1, "School Name", formData.schoolName, 55, y, 130, 360)
  y = drawField(page1, "Programme Coordinator", formData.programOfficerName, 55, y, 130, 360)
  y = drawField(page1, "Unit Number", formData.unitNo, 55, y, 130, 360)
  y = drawField(page1, "Enrollment", formatEnrollment(formData.enrollment), 55, y, 130, 360)

  // Personal details - reserve right column area for photo & signature so left column won't overlap
  y -= 10
  drawHeaderLine(page1, "Personal Details", y)
  y -= 28

  // layout parameters
  const photoW = 100, photoH = 120
  const photoX = 420
  // place photo top aligned with current y
  const photoY = y - photoH + 18 // keep slight padding
  // signature box placed under photo with spacing
  const sigW = 100, sigH = 40
  const sigX = photoX
  const sigY = photoY - sigH - 18

  // draw photo frame first (so left fields can be aware of reserved space)
  // page1.drawRectangle({ x: photoX, y: photoY, width: photoW, height: photoH, borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })
  
  const pageWidth = (page1.getWidth && typeof page1.getWidth === "function") ? page1.getWidth() : 595
  const shiftFromRight = 20 + 12 
  const newPhotoX = pageWidth - shiftFromRight - photoW

  // erase the earlier frame (draw a white filled rectangle over it) so it appears moved
  page1.drawRectangle({ x: photoX, y: photoY, width: photoW, height: photoH, color: rgb(1, 1, 1), borderWidth: 0 })

  // draw frame at new position
  page1.drawRectangle({ x: newPhotoX, y: photoY, width: photoW, height: photoH, borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })

  if (formData.photo) {
    try {
      const buf = await imageToBuffer(formData.photo)
      if (buf) {
        let img
        try { img = await pdfDoc.embedPng(buf) } catch { img = await pdfDoc.embedJpg(buf) }
        page1.drawImage(img, { x: newPhotoX + 2, y: photoY + 2, width: photoW - 4, height: photoH - 4 })
      } else {
        page1.drawText("Photo", { x: newPhotoX + (photoW / 2) - 10, y: photoY + (photoH / 2) - 5, size: 10, color: rgb(0.5, 0.5, 0.5) })
      }
    } catch (e) {
      page1.drawText("Photo", { x: newPhotoX + (photoW / 2) - 10, y: photoY + (photoH / 2) - 5, size: 10, color: rgb(0.5, 0.5, 0.5) })
    }
  } else {
    page1.drawText("Photo", { x: newPhotoX + (photoW / 2) - 10, y: photoY + (photoH / 2) - 5, size: 10, color: rgb(0.5, 0.5, 0.5) })
  }

  // Now draw left column fields. After each field y decreases.
  y = drawField(page1, "Name", formData.nameEnglish, 55, y, 90, 300)
  y = drawField(page1, "Father's Name", formData.fatherName, 55, y, 90, 300)
  y = drawField(page1, "Mother's Name", formData.motherName, 55, y, 90, 300)
  y = drawField(page1, "Date of Birth", formatDate(formData.dateOfBirth), 55, y, 90, 300)
  y = drawField(page1, "Mobile Number", formData.mobileNo, 55, y, 90, 300)
  y = drawField(page1, "Email ID", formData.emailId, 55, y, 90, 300)
  y = drawField(page1, "Department", formData.departmentName, 55, y, 90, 300)
  y = drawField(page1, "Course Name", formData.courseName, 55, y, 90, 300)
  y = drawField(page1, "Class/Semester", formData.classSemester, 55, y, 90, 300)
  y = drawField(page1, "Blood Group", formData.bloodGroup, 55, y, 90, 300)
  y = drawField(page1, "Gender", formatGender(formData.gender), 55, y, 90, 300)
  y = drawField(page1, "Category", formData.category?.toUpperCase(), 55, y, 90, 300)
  y = drawField(page1, "Institution I-Card No.", formData.institutionalIdCard, 55, y, 90, 300)

  // Ensure left column does not collide with photo/signature area.
  // If left column has reached into the reserved right-column vertical space, move Y below signature area.
  const minYForLeftColumn = sigY - 18 // require some padding below signature
  if (y < minYForLeftColumn) {
    y = minYForLeftColumn
  }

  const shiftRight = 42
  const sigXShifted = sigX + shiftRight

  // Draw signature box (right column below photo) — will not overlap left column now
  page1.drawRectangle({ x: sigXShifted, y: sigY, width: sigW, height: sigH, borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })
  if (formData.signature) {
    try {
      const buf = await imageToBuffer(formData.signature)
      if (buf) {
        let sImg
        try { sImg = await pdfDoc.embedPng(buf) } catch { sImg = await pdfDoc.embedJpg(buf) }
        page1.drawImage(sImg, { x: sigXShifted + 2, y: sigY + 2, width: sigW - 4, height: sigH - 4 })
      } else {
        page1.drawText("Student Signature", { x: sigXShifted + 2, y: sigY - 10, size: 9, color: rgb(0.45, 0.45, 0.45) })
      }
    } catch (e) {
      page1.drawText("Student Signature", { x: sigXShifted + 2, y: sigY - 10, size: 9, color: rgb(0.45, 0.45, 0.45) })
    }
  } else {
    page1.drawText("Student Signature", { x: sigXShifted + 2, y: sigY - 10, size: 9, color: rgb(0.45, 0.45, 0.45) })
  }

  // PAGE 2
  const page2 = pdfDoc.addPage([595, 842])
  let y2 = 800

  drawHeaderLine(page2, "Educational Details", y2)
  y2 -= 30
  y2 = drawField(page2, "High School Roll No.", formData.highSchoolRollNo, 55, y2, 140, 360)
  y2 = drawField(page2, "Class/Semester", formData.classSemester, 55, y2, 140, 360)
  y2 = drawField(page2, "High School Certificate", formData.highSchoolCertificate ? "Uploaded" : "Not Uploaded", 55, y2, 140, 360)

  y2 -= 10
  drawHeaderLine(page2, "NSS Enrollment Details", y2)
  y2 -= 28
  y2 = drawField(page2, "NSS Enrollment Year", formatEnrollment(formData.nssEnrollmentYear), 55, y2, 140, 360)
  y2 = drawField(page2, "Attended 7-Day Camp", formData.attendedSpecialCamp ? "Yes" : "No", 55, y2, 140, 360)

  if (formData.attendedSpecialCamp && formData.specialCampDetails) {
    y2 -= 6
    page2.drawText("Special Camp Details:", { x: 75, y: y2, size: 11, color: rgb(0.1, 0.2, 0.5) })
    y2 -= 22
    y2 = drawField(page2, "Village/Slum", formData.specialCampDetails.villageName, 75, y2, 160, 320)
    y2 = drawField(page2, "Date", formatDate(formData.specialCampDetails.date), 75, y2, 160, 320)
    y2 = drawField(page2, "Venue", formData.specialCampDetails.venue, 75, y2, 160, 320)
  }

  y2 -= 6
  drawHeaderLine(page2, "My Bharat Portal Registration", y2)
  y2 -= 28
  y2 = drawField(page2, "Registered on My Bharat Portal", formData.myBharatPortalRegistered ? "Yes" : "No", 55, y2, 220, 240)

  y2 -= 6
  drawHeaderLine(page2, "Additional Achievements", y2)
  y2 -= 28
  y2 = drawField(page2, "NSS Achievements", formData.specialNSSAchievements, 55, y2, 120, 400)
  y2 = drawField(page2, "Attended ELP", formData.attendedELP ? "Yes" : "No", 55, y2, 120, 400)
  y2 = drawField(page2, "Other Achievements", formData.otherAchievements, 55, y2, 120, 400)

  y2 -= 6
  drawHeaderLine(page2, "Address Details", y2)
  y2 -= 28
  const addrTypeText = formData.addressType ? (formData.addressType === "hostler" ? "Hostler" : formData.addressType === "dayscholar" ? "Day Scholar" : formData.addressType) : ""
  y2 = drawField(page2, "Address Type", addrTypeText, 55, y2, 120, 420)
  if (formData.addressType === "hostler") y2 = drawField(page2, "Hostel Address", formData.hostelAddress, 55, y2, 120, 420)
  if (formData.addressType === "dayscholar") y2 = drawField(page2, "Home Address", formData.homeAddress, 55, y2, 120, 420)

  y2 -= 20
  drawHeaderLine(page2, "Self Declaration", y2)
  y2 -= 34
  page2.drawText("I hereby declare that all the information provided above is true to the best of my knowledge.", { x: 55, y: y2, size: 11, color: rgb(0.2, 0.2, 0.2) })

  // Signatures bottom on page2
  y2 -= 80
  const volX = 55, volY = y2, volW = 140, volH = 40
  page2.drawRectangle({ x: volX, y: volY, width: volW, height: volH, borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })
  if (formData.signature) {
    try {
      const buf = await imageToBuffer(formData.signature)
      if (buf) {
        let sImg
        try { sImg = await pdfDoc.embedPng(buf) } catch { sImg = await pdfDoc.embedJpg(buf) }
        page2.drawImage(sImg, { x: volX + 2, y: volY + 2, width: volW - 4, height: volH - 4 })
      }
    } catch {}
  }
  page2.drawText("Signature of Volunteer", { x: volX, y: volY - 15, size: 10, color: rgb(0.3, 0.3, 0.3) })

  const coordX = 360, coordY = volY, coordW = 140, coordH = 40
  page2.drawRectangle({ x: coordX, y: coordY, width: coordW, height: coordH, borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })
  try {
    const coordBuf = loadLocalFile("public/coordinatorSign.png")
    const coordImg = await pdfDoc.embedPng(coordBuf)
    page2.drawImage(coordImg, { x: coordX + 2, y: coordY + 2, width: coordW - 4, height: coordH - 4 })
  } catch {}
  page2.drawText("Signature of Programme Coordinator", { x: coordX - 25, y: coordY - 15, size: 10, color: rgb(0.3, 0.3, 0.3) })

  return pdfDoc.save()
}
