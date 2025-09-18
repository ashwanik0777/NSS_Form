import { PDFDocument, rgb } from "pdf-lib"
const fontkit = require('fontkit');
import fs from "fs"
import path from "path"

// Helper to load image as Uint8Array
function loadImage(filePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), filePath))
}

export async function generateNSSApplicationPDF(formData: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // Load NotoSansDevanagari font for all text (English and Hindi)
  let notoFont
  try {
    let fontPath = path.resolve(process.cwd(), "public/fonts/NotoSansDevanagari-Regular.ttf")
    if (!fs.existsSync(fontPath)) {
      fontPath = path.resolve(process.cwd(), "lib/fonts/NotoSansDevanagari-Regular.ttf")
    }
    if (!fs.existsSync(fontPath)) {
      console.error("Font file not found at:", fontPath)
      throw new Error("NotoSansDevanagari-Regular.ttf not found in public/fonts or lib/fonts. PDF cannot be generated.")
    }
    const notoRegularBytes = fs.readFileSync(fontPath)
    notoFont = await pdfDoc.embedFont(notoRegularBytes)
    console.log("NotoSansDevanagari-Regular loaded for all text from:", fontPath)
  } catch (error) {
    throw error
  }

  let logo1, logo2, logo3
  try {
    logo1 = await pdfDoc.embedPng(loadImage("public/1.png"))
    logo2 = await pdfDoc.embedPng(loadImage("public/myBharatLogo.png"))
    logo3 = await pdfDoc.embedPng(loadImage("public/nssLogo.png"))
  } catch (error) {
    console.log("Logos not found")
  }

  // Always use NotoSansDevanagari for all text
  const drawText = (page: any, text: string, x: number, y: number, size = 12, opts: any = {}) => {
    page.drawText(text || "", {
      x,
      y,
      size,
      font: notoFont,
      color: opts.color || rgb(0.2, 0.2, 0.2),
      maxWidth: opts.maxWidth || 500,
      lineHeight: opts.lineHeight || size * 1.2,
      ...opts,
    })
  }
  // drawHindiText is now just an alias for drawText
  const drawHindiText = drawText;

  const drawSectionHeader = (page: any, title: string, hindiTitle: string, y: number) => {
    // Background rectangle for section header
    page.drawRectangle({
      x: 40,
      y: y - 5,
      width: 515,
      height: 25,
      color: rgb(0.95, 0.95, 0.98),
      borderColor: rgb(0.1, 0.1, 0.5),
      borderWidth: 1,
    })

    drawText(page, title, 50, y + 5, 14, { bold: true, color: rgb(0.1, 0.1, 0.5) })
    drawHindiText(page, hindiTitle, 300, y + 5, 14, { bold: true, color: rgb(0.1, 0.1, 0.5) })
  }

  const drawField = (page: any, label: string, value: string, x: number, y: number, width = 200) => {
    drawText(page, `${label}:`, x, y, 11, { bold: true, color: rgb(0.3, 0.3, 0.3) })
    drawText(page, value || "-", x, y - 15, 11, { maxWidth: width })
    return y - 35 // Return next Y position
  }

  const drawHindiField = (page: any, label: string, value: string, x: number, y: number, width = 200) => {
    drawHindiText(page, `${label}:`, x, y, 11, { color: rgb(0.3, 0.3, 0.3) })
    drawHindiText(page, value || "-", x, y - 15, 11, { maxWidth: width })
    return y - 35
  }

  // PAGE 1: Professional Header and Personal Details
  const page1 = pdfDoc.addPage([595, 842]) // A4 portrait

  // Top border
  page1.drawRectangle({
    x: 30,
    y: 750,
    width: 535,
    height: 80,
    borderColor: rgb(0.1, 0.1, 0.5),
    borderWidth: 2,
  })

  // Draw logos with better positioning
  if (logo1) page1.drawImage(logo1, { x: 45, y: 770, width: 50, height: 50 })
  if (logo2) page1.drawImage(logo2, { x: 272, y: 770, width: 50, height: 50 })
  if (logo3) page1.drawImage(logo3, { x: 500, y: 770, width: 50, height: 50 })

  drawHindiText(page1, "गौतम बुद्ध विश्वविद्यालय", 180, 810, 18, { bold: true, color: rgb(0.1, 0.1, 0.5) })
  drawText(page1, "Gautam Buddha University", 180, 790, 16, { color: rgb(0.2, 0.2, 0.2) })
  drawHindiText(page1, "राष्ट्रीय सेवा योजना (NSS)", 200, 770, 14, { bold: true, color: rgb(0.1, 0.1, 0.5) })
  drawText(page1, "National Service Scheme", 210, 755, 12, { color: rgb(0.2, 0.2, 0.2) })

  // Form title with year
  drawSectionHeader(page1, "Volunteer Registration Form", "स्वयंसेवक पंजीकरण फॉर्म", 720)
  drawText(page1, `Academic Year: 2025-26 | Form No: ${formData.formNo || "N/A"}`, 50, 695, 12, { bold: true })

  // Institution Details Section
  drawSectionHeader(page1, "Institution Details", "संस्थान विवरण", 665)
  let currentY = 640
  currentY = drawField(page1, "Institution Name", formData.institutionName, 50, currentY)
  currentY = drawField(page1, "Programme Officer", formData.programOfficerName, 320, currentY + 35)
  currentY = drawField(page1, "Unit Number", formData.unitNo, 50, currentY + 35)
  currentY = drawField(page1, "Enrollment Number", formData.enrollment, 320, currentY + 35)

  // Personal Details Section
  drawSectionHeader(page1, "Personal Details", "व्यक्तिगत विवरण", currentY - 10)
  currentY -= 35

  // Student photo with professional frame
  if (formData.photo) {
    try {
      const photoImg = await pdfDoc.embedJpg(loadImage(formData.photo))
      // Photo frame
      page1.drawRectangle({
        x: 450,
        y: currentY - 80,
        width: 90,
        height: 110,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 2,
      })
      page1.drawImage(photoImg, { x: 455, y: currentY - 75, width: 80, height: 100 })
      drawText(page1, "Student Photo", 465, currentY - 90, 10, { bold: true })
    } catch (error) {
      // Draw placeholder
      page1.drawRectangle({
        x: 450,
        y: currentY - 80,
        width: 90,
        height: 110,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
      })
      drawText(page1, "Photo", 475, currentY - 25, 12, { color: rgb(0.5, 0.5, 0.5) })
    }
  }

  currentY = drawField(page1, "Name (English)", formData.nameEnglish, 50, currentY, 180)
  currentY = drawHindiField(page1, "नाम (हिंदी)", formData.nameHindi, 50, currentY + 35, 180)
  currentY = drawField(page1, "Father's Name", formData.fatherName, 50, currentY + 35, 180)
  currentY = drawField(page1, "Mother's Name", formData.motherName, 50, currentY + 35, 180)

  // Two column layout for remaining fields
  let leftY = currentY + 35
  let rightY = currentY + 35

  leftY = drawField(page1, "Date of Birth", formData.dateOfBirth, 50, leftY)
  rightY = drawField(page1, "Mobile Number", formData.mobileNo, 320, rightY)
  leftY = drawField(page1, "Email ID", formData.emailId, 50, leftY)
  rightY = drawField(page1, "Gender", formData.gender, 320, rightY)
  leftY = drawField(page1, "Department", formData.departmentName, 50, leftY)
  rightY = drawField(page1, "Category", formData.category, 320, rightY)

  // PAGE 2: Educational and NSS Details
  const page2 = pdfDoc.addPage([595, 842])
  currentY = 800

  // Educational Details
  drawSectionHeader(page2, "Educational Details", "शैक्षणिक विवरण", currentY)
  currentY -= 35
  currentY = drawField(page2, "High School Roll No", formData.highSchoolRollNo, 50, currentY)
  currentY = drawField(page2, "Class/Semester", formData.classSemester, 320, currentY + 35)
  currentY = drawField(page2, "Institutional I-Card No", formData.institutionalIdCard, 50, currentY + 35)

  // NSS Enrollment Details
  drawSectionHeader(page2, "NSS Enrollment Details", "NSS नामांकन विवरण", currentY - 20)
  currentY -= 55
  currentY = drawField(page2, "NSS Enrollment Year", formData.nssEnrollmentYear, 50, currentY)
  currentY = drawField(
    page2,
    "My Bharat Portal Registered",
    formData.myBharatPortalRegistered ? "Yes / हाँ" : "No / नहीं",
    320,
    currentY + 35,
  )

  // Special Camp Details
  drawSectionHeader(page2, "07-Day Special Camp Details", "07-दिवसीय विशेष शिविर विवरण", currentY - 20)
  currentY -= 55
  currentY = drawField(
    page2,
    "Attended Special Camp",
    formData.attendedSpecialCamp ? "Yes / हाँ" : "No / नहीं",
    50,
    currentY,
  )

  if (formData.attendedSpecialCamp && formData.specialCampDetails) {
    currentY = drawField(page2, "Village/Slum Name", formData.specialCampDetails.villageName, 50, currentY)
    currentY = drawField(page2, "Camp Date", formData.specialCampDetails.date, 320, currentY + 35)
    currentY = drawField(page2, "Venue", formData.specialCampDetails.venue, 50, currentY + 35)
  }

  // Achievements Section
  drawSectionHeader(page2, "Additional Achievements", "अतिरिक्त उपलब्धियां", currentY - 20)
  currentY -= 55
  currentY = drawField(page2, "Special NSS Achievements", formData.specialNSSAchievements, 50, currentY, 480)
  currentY = drawField(page2, "Attended ELP", formData.attendedELP ? "Yes / हाँ" : "No / नहीं", 50, currentY)
  currentY = drawField(page2, "Other Achievements", formData.otherAchievements, 50, currentY, 480)

  // PAGE 3: Declaration and Signatures
  const page3 = pdfDoc.addPage([595, 842])

  drawSectionHeader(page3, "Self Declaration", "स्वयं घोषणा", 780)

  // Checkbox with tick mark
  page3.drawRectangle({
    x: 50,
    y: 740,
    width: 16,
    height: 16,
    borderColor: rgb(0.1, 0.1, 0.5),
    borderWidth: 2,
    color: rgb(1, 1, 1),
  })
  // Professional tick mark
  page3.drawLine({ start: { x: 53, y: 747 }, end: { x: 57, y: 743 }, color: rgb(0, 0.7, 0), thickness: 2 })
  page3.drawLine({ start: { x: 57, y: 743 }, end: { x: 63, y: 752 }, color: rgb(0, 0.7, 0), thickness: 2 })

  // Declaration text with proper formatting
  const declarationEng =
    "I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief. If any information is found incorrect, my enrollment shall be cancelled and I will be liable for disciplinary action."
  const declarationHindi =
    "मैं घोषणा करता/करती हूँ कि मेरे द्वारा दी गई उपरोक्त जानकारी मेरी जानकारी और विश्वास के अनुसार सत्य और सही है। यदि कोई जानकारी गलत पाई जाती है, तो मेरा नामांकन रद्द कर दिया जाएगा और मैं अनुशासनात्मक कार्रवाई के लिए उत्तरदायी रहूंगा/रहूंगी।"

  drawText(page3, declarationEng, 75, 745, 11, { maxWidth: 470, lineHeight: 16 })
  drawHindiText(page3, declarationHindi, 75, 680, 11, { maxWidth: 470, lineHeight: 18 })

  // Signature section with professional layout
  page3.drawRectangle({
    x: 40,
    y: 150,
    width: 515,
    height: 200,
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
  })

  // Student section
  drawText(page3, "Student Details", 60, 320, 14, { bold: true, color: rgb(0.1, 0.1, 0.5) })
  drawHindiText(page3, "छात्र विवरण", 200, 320, 14, { color: rgb(0.1, 0.1, 0.5) })

  // Photo placeholder in signature section
  if (formData.photo) {
    try {
      const photoImg = await pdfDoc.embedJpg(loadImage(formData.photo))
      page3.drawRectangle({
        x: 60,
        y: 240,
        width: 70,
        height: 70,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
      })
      page3.drawImage(photoImg, { x: 65, y: 245, width: 60, height: 60 })
    } catch (error) {
      page3.drawRectangle({
        x: 60,
        y: 240,
        width: 70,
        height: 70,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
      })
      drawText(page3, "Photo", 80, 270, 10, { color: rgb(0.5, 0.5, 0.5) })
    }
  }

  // Signature boxes
  page3.drawRectangle({
    x: 60,
    y: 170,
    width: 120,
    height: 50,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  })

  page3.drawRectangle({
    x: 350,
    y: 170,
    width: 150,
    height: 50,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  })

  drawText(page3, "Student Signature", 70, 155, 11, { bold: true })
  drawHindiText(page3, "छात्र हस्ताक्षर", 70, 140, 11)

  drawText(page3, "Programme Officer Signature", 360, 155, 11, { bold: true })
  drawHindiText(page3, "कार्यक्रम अधिकारी हस्ताक्षर", 360, 140, 11)

  // Date fields
  drawText(page3, `Date: ${new Date().toLocaleDateString("en-IN")}`, 70, 120, 11)
  drawHindiText(page3, `दिनांक: ${new Date().toLocaleDateString("hi-IN")}`, 360, 120, 11)

  // Footer
  drawText(page3, "Gautam Buddha University - National Service Scheme", 150, 50, 10, { color: rgb(0.5, 0.5, 0.5) })
  drawHindiText(page3, "गौतम बुद्ध विश्वविद्यालय - राष्ट्रीय सेवा योजना", 150, 35, 10, { color: rgb(0.5, 0.5, 0.5) })

  return await pdfDoc.save()
}
