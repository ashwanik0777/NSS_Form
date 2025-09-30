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
  schoolName?: string
  highSchoolCertificate: any
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
  permanentAddress?: string
  correspondenceAddress?: string
  emergencyPerson?: string
  emergencyRelation?: string
  emergencyContact?: string
}

// Helper functions
async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error fetching image from URL:', error)
    throw error
  }
}

async function processImageForPDF(imageString: string | undefined): Promise<Buffer | null> {
  if (!imageString) return null
  
  try {
    if (imageString.startsWith('data:image/')) {
      const base64Data = imageString.replace(/^data:image\/[a-z]+;base64,/, '')
      return Buffer.from(base64Data, 'base64')
    } else if (imageString.startsWith('http://') || imageString.startsWith('https://')) {
      return await fetchImageBuffer(imageString)
    } else if (imageString.startsWith('/')) {
      const fullPath = path.join(process.cwd(), 'public', imageString)
      return fs.readFileSync(fullPath)
    } else {
      const fullPath = path.join(process.cwd(), 'public', imageString)
      return fs.readFileSync(fullPath)
    }
  } catch (error) {
    console.error('Error processing image:', error)
    return null
  }
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
    thickness: 2,
    color: rgb(0.1, 0.2, 0.6),
  })
}

function drawFormField(page: PDFPage, label: string, value: string | undefined, x: number, y: number, labelWidth = 90, fieldWidth = 220) {
  // Label
  page.drawText(label + ":", { 
    x, 
    y, 
    size: 10, 
    color: rgb(0.3, 0.3, 0.3) 
  })
  
  // Field box
  page.drawRectangle({
    x: x + labelWidth,
    y: y - 3,
    width: fieldWidth,
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.7, 0.7),
    color: rgb(1, 1, 1),
  })
  
  // Value
  if (value) {
    page.drawText(String(value), {
      x: x + labelWidth + 5,
      y: y + 2,
      size: 9,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  
  return y - 25
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

function formatEnrollment(enrollment: string | undefined) {
  if (enrollment === "first-year") return "First Year"
  if (enrollment === "second-year") return "Second Year"
  return enrollment || ""
}

function formatGender(gender: string | undefined) {
  if (gender === "male") return "Male"
  if (gender === "female") return "Female"
  if (gender === "other") return "Other"
  return gender || ""
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export async function generateNSSApplicationPDF(formData: FormData) {
  const pdfDoc = await PDFDocument.create()

  // Load logos
  const logo1 = await pdfDoc.embedPng(loadImage("public/1.png"))
  const logo2 = await pdfDoc.embedPng(loadImage("public/myBharatLogo.png"))
  const logo3 = await pdfDoc.embedPng(loadImage("public/nssLogo.png"))

  // ---------------- PAGE 1 ----------------
  const page1 = pdfDoc.addPage([595, 842])
  let currentY = 800

  // Top logos
  if (logo1) page1.drawImage(logo1, { x: 55, y: 760, width: 40, height: 40 })
  if (logo2) page1.drawImage(logo2, { x: 277, y: 760, width: 40, height: 40 })
  if (logo3) page1.drawImage(logo3, { x: 500, y: 760, width: 40, height: 40 })

  // Header text
  drawCenteredText(page1, "Gautam Buddha University", 745, 14, { color: rgb(0.1, 0.1, 0.4) })
  drawCenteredText(page1, "National Service Scheme (NSS)", 725, 13, { color: rgb(0.1, 0.1, 0.4)})
  drawCenteredText(page1, "VOLUNTEER REGISTRATION FORM", 705, 16, { color: rgb(0, 0, 0) })

  // Academic year and form number
  drawText(
    page1,
    `Academic Year: 2025-26 | Form No: ${formData.formNo || "N/A"}`,
    55,
    680,
    10,
    { color: rgb(0.3, 0.3, 0.3) }
  )

  // Institution Details Section
  currentY = 650
  drawSectionHeader(page1, "Institution Details", currentY)
  currentY -= 30

  currentY = drawFormField(page1, "Institution Name", formData.institutionName, 55, currentY, 120, 350)
  currentY = drawFormField(page1, "School Name", formData.schoolName, 55, currentY, 120, 350)
  currentY = drawFormField(page1, "Programme Coordinator", formData.programOfficerName, 55, currentY, 120, 350)
  currentY = drawFormField(page1, "Unit Number", formData.unitNo, 55, currentY, 120, 350)
  currentY = drawFormField(page1, "Enrollment", formatEnrollment(formData.enrollment), 55, currentY, 120, 350)

  // Personal Details Section
  currentY -= 15
  drawSectionHeader(page1, "Personal Details", currentY)
  currentY -= 30

  // Photo placement (right side)
  const photoX = 420
  const photoY = currentY - 120
  const photoWidth = 100
  const photoHeight = 120

  if (formData.photo) {
    try {
      const photoBuffer = await processImageForPDF(formData.photo)
      
      if (photoBuffer) {
        let photoImg
        try {
          photoImg = await pdfDoc.embedPng(photoBuffer)
        } catch {
          try {
            photoImg = await pdfDoc.embedJpg(photoBuffer)
          } catch (err) {
            console.error("Failed to embed photo:", err)
            throw err
          }
        }
        
        // Photo frame
        page1.drawRectangle({
          x: photoX,
          y: photoY,
          width: photoWidth,
          height: photoHeight,
          borderWidth: 1,
          borderColor: rgb(0.6, 0.6, 0.6),
        })
        
        // Photo image
        page1.drawImage(photoImg, { 
          x: photoX + 2, 
          y: photoY + 2, 
          width: photoWidth - 4, 
          height: photoHeight - 4 
        })
      }
    } catch (err) {
      console.error("Photo embed error:", err)
      // Empty photo frame
      page1.drawRectangle({
        x: photoX,
        y: photoY,
        width: photoWidth,
        height: photoHeight,
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      })
      drawText(page1, "Photo", photoX + 35, photoY + 55, 10, { color: rgb(0.5, 0.5, 0.5) })
    }
  } else {
    // Empty photo frame
    page1.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoWidth,
      height: photoHeight,
      borderWidth: 1,
      borderColor: rgb(0.6, 0.6, 0.6),
    })
    drawText(page1, "Photo", photoX + 35, photoY + 55, 10, { color: rgb(0.5, 0.5, 0.5) })
  }

  // Personal fields (left side)
  currentY = drawFormField(page1, "Name", formData.nameEnglish, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Father's Name", formData.fatherName, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Mother's Name", formData.motherName, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Date of Birth", formatDate(formData.dateOfBirth), 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Mobile Number", formData.mobileNo, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Email ID", formData.emailId, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Department", formData.departmentName, 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Gender", formatGender(formData.gender), 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Category", formData.category?.toUpperCase(), 55, currentY, 90, 250)
  currentY = drawFormField(page1, "Institution I-Card No.", formData.institutionalIdCard, 55, currentY, 90, 250)

  // Signature placement (right side, below photo)
  const signatureX = 420
  const signatureY = photoY - 60
  const signatureWidth = 100
  const signatureHeight = 40

  if (formData.signature) {
    try {
      const signatureBuffer = await processImageForPDF(formData.signature)
      
      if (signatureBuffer) {
        let signatureImg
        try {
          signatureImg = await pdfDoc.embedPng(signatureBuffer)
        } catch {
          try {
            signatureImg = await pdfDoc.embedJpg(signatureBuffer)
          } catch (err) {
            console.error("Failed to embed signature:", err)
            throw err
          }
        }
        
        // Signature frame
        page1.drawRectangle({
          x: signatureX,
          y: signatureY,
          width: signatureWidth,
          height: signatureHeight,
          borderWidth: 1,
          borderColor: rgb(0.6, 0.6, 0.6),
        })
        
        // Signature image
        page1.drawImage(signatureImg, { 
          x: signatureX + 2, 
          y: signatureY + 2, 
          width: signatureWidth - 4, 
          height: signatureHeight - 4 
        })
        
        drawText(page1, "Student Signature", signatureX, signatureY - 15, 9, { color: rgb(0.3, 0.3, 0.3) })
      }
    } catch (err) {
      console.error("Signature embed error:", err)
      // Empty signature frame
      page1.drawRectangle({
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      })
      drawText(page1, "Signature", signatureX + 25, signatureY + 15, 9, { color: rgb(0.5, 0.5, 0.5) })
    }
  } else {
    // Empty signature frame
    page1.drawRectangle({
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
      borderWidth: 1,
      borderColor: rgb(0.6, 0.6, 0.6),
    })
    drawText(page1, "Student Signature", signatureX, signatureY - 15, 9, { color: rgb(0.3, 0.3, 0.3) })
  }

  // ---------------- PAGE 2 ----------------
  const page2 = pdfDoc.addPage([595, 842])
  let y2 = 800

  // Educational Details Section
  drawSectionHeader(page2, "Educational Details", y2)
  y2 -= 30
  y2 = drawFormField(page2, "High School Roll No.", formData.highSchoolRollNo, 55, y2, 140, 300)
  y2 = drawFormField(page2, "Class/Semester", formData.classSemester, 55, y2, 140, 300)
  // Add High School Certificate status
  y2 = drawFormField(
    page2,
    "High School Certificate",
    formData.highSchoolCertificate ? "✓ Uploaded" : "Not Uploaded",
    55,
    y2,
    140,
    300
  )

  // NSS Enrollment Details Section
  y2 -= 15
  drawSectionHeader(page2, "NSS Enrollment Details", y2)
  y2 -= 30
  y2 = drawFormField(page2, "NSS Enrollment Year", formatEnrollment(formData.nssEnrollmentYear), 55, y2, 120, 300)
  y2 = drawFormField(page2, "Attended 7-Day Camp", formData.attendedSpecialCamp ? "Yes" : "No", 55, y2, 120, 300)
  
  if (formData.attendedSpecialCamp && formData.specialCampDetails) {
    y2 -= 10
    drawText(page2, "Special Camp Details:", 75, y2, 11, { color: rgb(0.1, 0.2, 0.5) })
    y2 -= 25
    y2 = drawFormField(page2, "Village/Urban Slum Name", formData.specialCampDetails.villageName, 75, y2, 160, 280)
    y2 = drawFormField(page2, "Date", formatDate(formData.specialCampDetails.date), 75, y2, 160, 280)
    y2 = drawFormField(page2, "Venue", formData.specialCampDetails.venue, 75, y2, 160, 280)
  }

  // My Bharat Portal Registration Section
  y2 -= 15
  drawSectionHeader(page2, "My Bharat Portal Registration", y2)
  y2 -= 30
  y2 = drawFormField(page2, "Registered on My Bharat Portal", formData.myBharatPortalRegistered ? "Yes" : "No", 55, y2, 180, 300)

  // Additional Achievements Section
  y2 -= 15
  drawSectionHeader(page2, "Additional Achievements", y2)
  y2 -= 30
  y2 = drawFormField(page2, "NSS Achievements", formData.specialNSSAchievements, 55, y2, 120, 350)
  y2 = drawFormField(page2, "Attended ELP", formData.attendedELP ? "Yes" : "No", 55, y2, 120, 350)
  y2 = drawFormField(page2, "Other Achievements", formData.otherAchievements, 55, y2, 120, 350)

  // Address Details Section
  y2 -= 15
  drawSectionHeader(page2, "Address Details", y2)
  y2 -= 30
  y2 = drawFormField(page2, "Permanent Add.", formData.permanentAddress, 55, y2, 120, 400)
  y2 = drawFormField(page2, "Correspondence Add.", formData.correspondenceAddress, 55, y2, 120, 400)

  // Emergency Contact Section
  y2 -= 15
  drawSectionHeader(page2, "Emergency Contact", y2)
  y2 -= 30
  y2 = drawFormField(page2, "Contact Person", formData.emergencyPerson, 55, y2, 120, 300)
  y2 = drawFormField(page2, "Relation", formData.emergencyRelation, 55, y2, 120, 300)
  y2 = drawFormField(page2, "Contact Number", formData.emergencyContact, 55, y2, 120, 300)

  // Self Declaration Section
  y2 -= 25
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

  // Signature section at bottom
  y2 -= 80

  // Volunteer Signature (left)
  const volSignX = 55
  const volSignY = y2
  const volSignWidth = 140
  const volSignHeight = 40

  // Student signature rendering (same as above, always show frame and image/text)
  if (formData.signature) {
    try {
      const signatureBuffer = await processImageForPDF(formData.signature)
      if (signatureBuffer) {
        let signatureImg
        try {
          signatureImg = await pdfDoc.embedPng(signatureBuffer)
        } catch {
          signatureImg = await pdfDoc.embedJpg(signatureBuffer)
        }
        page2.drawRectangle({
          x: volSignX,
          y: volSignY,
          width: volSignWidth,
          height: volSignHeight,
          borderWidth: 1,
          borderColor: rgb(0.6, 0.6, 0.6),
        })
        page2.drawImage(signatureImg, { 
          x: volSignX + 2, 
          y: volSignY + 2, 
          width: volSignWidth - 4, 
          height: volSignHeight - 4 
        })
      }
    } catch (err) {
      page2.drawRectangle({
        x: volSignX,
        y: volSignY,
        width: volSignWidth,
        height: volSignHeight,
        borderWidth: 1,
        borderColor: rgb(0.6, 0.6, 0.6),
      })
      drawText(page2, "Signature", volSignX + 40, volSignY + 15, 11, { color: rgb(0.5, 0.5, 0.5) })
    }
  } else {
    page2.drawRectangle({
      x: volSignX,
      y: volSignY,
      width: volSignWidth,
      height: volSignHeight,
      borderWidth: 1,
      borderColor: rgb(0.6, 0.6, 0.6),
    })
    drawText(page2, "Signature", volSignX + 40, volSignY + 15, 11, { color: rgb(0.5, 0.5, 0.5) })
  }
  drawText(page2, "Signature of Volunteer", volSignX, volSignY - 15, 11, { color: rgb(0.3, 0.3, 0.3) })

  // Coordinator Signature (right)
  const coordSignX = 360
  const coordSignY = y2
  const coordSignWidth = 140
  const coordSignHeight = 40

  page2.drawRectangle({
    x: coordSignX,
    y: coordSignY,
    width: coordSignWidth,
    height: coordSignHeight,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  })
  try {
    const coordinatorSignImg = await pdfDoc.embedPng(loadImage("public/coordinatorSign.png"))
    page2.drawImage(coordinatorSignImg, { 
      x: coordSignX + 2, 
      y: coordSignY + 2, 
      width: coordSignWidth - 4, 
      height: coordSignHeight - 4 
    })
  } catch (err) {
    drawText(page2, "Signature", coordSignX + 40, coordSignY + 15, 11, { color: rgb(0.5, 0.5, 0.5) })
  }
  drawText(page2, "Signature of Programme Coordinator", coordSignX - 25, coordSignY - 15, 11, { color: rgb(0.3, 0.3, 0.3) })

  return await pdfDoc.save()
}
