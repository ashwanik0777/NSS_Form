import { PDFDocument, PDFPage, rgb } from "pdf-lib"
import fs from "fs"
import path from "path"

interface FormData {
  formNo?: string
  institutionName?: string
  programOfficerName?: string
  unitNo?: string
  enrollment?: string
  photo?: Buffer
  nameEnglish?: string
  fatherName?: string
  motherName?: string
  dateOfBirth?: string
  emailId?: string
  departmentName?: string
  mobileNo?: string
  gender?: string
  category?: string
  signature?: Buffer
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

// Utility: field box
function drawField(page: PDFPage, label: string, value: string | undefined, x: number, y: number, width = 220) {
  page.drawText(label + ":", { x, y, size: 11, color: rgb(0.2, 0.2, 0.2) })
  page.drawRectangle({
    x: x + 80,
    y: y - 2,
    width,
    height: 18,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
    color: rgb(1, 1, 1),
  })
  if (value) {
    page.drawText(String(value), {
      x: x + 85,
      size: 10,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  return y - 30
}

// Utility: text
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
  // Estimate text width (approximate calculation)
  const textWidth = text.length * size * 0.6
  const x = (width - textWidth) / 2
  page.drawText(text, { x, y, size, color: rgb(0, 0, 0) })
}


// Load image helper
function loadImage(filePath: string) {
  const absPath = path.join(process.cwd(), filePath)
  return fs.readFileSync(absPath)
}

export async function generateNSSApplicationPDF(formData: FormData) {
  const pdfDoc = await PDFDocument.create()

  // Load 3 logos from public folder
  const logo1 = await pdfDoc.embedPng(loadImage("public/1.png")) // GBU logo
  const logo2 = await pdfDoc.embedPng(loadImage("public/myBharatLogo.png")) // My Bharat logo
  const logo3 = await pdfDoc.embedPng(loadImage("public/nssLogo.png")) // NSS logo

  // ---------------- PAGE 1 ----------------
  const page1 = pdfDoc.addPage([595, 842]) // A4
  let currentY = 820

  // Top 3 logos
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
  currentY = drawField(page1, "Programme Officer", formData.programOfficerName, 55, currentY)
  currentY = drawField(page1, "Unit Number", formData.unitNo, 55, currentY)
  currentY = drawField(page1, "Enrollment Number", formData.enrollment, 55, currentY)

  // Personal Details
  currentY -= 20
  drawSectionHeader(page1, "Personal Details", currentY)
  currentY -= 25

  // Student Photo (right side)
  if (formData.photo) {
    try {
      const photoImg = await pdfDoc.embedJpg(formData.photo)
      page1.drawRectangle({
        x: 420,
        y: currentY - 10,
        width: 100,
        height: 120,
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      })
      page1.drawImage(photoImg, { x: 425, y: currentY - 5, width: 90, height: 110 })
    } catch {
      page1.drawRectangle({
        x: 420,
        y: currentY - 10,
        width: 100,
        height: 120,
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      })
      drawText(page1, "Photo", 445, currentY + 40, 12, { color: rgb(0.5, 0.5, 0.5) })
    }
  }

  // Personal Fields (left side)
  currentY = drawField(page1, "Name", formData.nameEnglish, 55, currentY)
  currentY = drawField(page1, "Father's Name", formData.fatherName, 55, currentY)
  currentY = drawField(page1, "Mother's Name", formData.motherName, 55, currentY)
  currentY = drawField(page1, "Date of Birth", formData.dateOfBirth, 55, currentY)
  currentY = drawField(page1, "Email ID", formData.emailId, 55, currentY)
  currentY = drawField(page1, "Department", formData.departmentName, 55, currentY)
  currentY = drawField(page1, "Mobile Number", formData.mobileNo, 55, currentY)
  currentY = drawField(page1, "Gender", formData.gender, 55, currentY)
  currentY = drawField(page1, "Category", formData.category, 55, currentY)

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
  let y2 = 780

  drawSectionHeader(page2, "Address Details", y2)
  y2 -= 25
  y2 = drawField(page2, "Permanent Address", formData.permanentAddress, 55, y2, 400)
  y2 = drawField(page2, "Correspondence Address", formData.correspondenceAddress, 55, y2, 400)

  y2 -= 20
  drawSectionHeader(page2, "Emergency Contact", y2)
  y2 -= 25
  y2 = drawField(page2, "Contact Person", formData.emergencyPerson, 55, y2)
  y2 = drawField(page2, "Relation", formData.emergencyRelation, 55, y2)
  y2 = drawField(page2, "Contact Number", formData.emergencyContact, 55, y2)

  y2 -= 30
  drawSectionHeader(page2, "Declaration", y2)
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
  drawText(page2, "Signature of Programme Officer", 320, y2, 11)

  return await pdfDoc.save()
}
