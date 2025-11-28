import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

interface VolunteerRow {
  name: string
  email: string
  mobileNo: string
  schoolName: string
  departmentName: string
  courseName: string
  year: string
  rollNumber: string
  unitNo: string
}

export async function generateVolunteerExportPDF(
  volunteers: VolunteerRow[],
  unitInfo: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595
  const pageHeight = 842
  const margin = 50
  const tableStartY = pageHeight - 100
  const rowHeight = 20
  const headerHeight = 30
  const fontSize = 9
  const headerFontSize = 10

  // Column widths
  const colWidths = {
    name: 80,
    email: 100,
    mobile: 60,
    school: 80,
    department: 80,
    course: 60,
    year: 40,
    roll: 60,
    unit: 35,
  }

  let currentY = tableStartY
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let rowIndex = 0

  // Title
  currentPage.drawText("NSS Volunteers Export", {
    x: margin,
    y: pageHeight - 50,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  // Unit info
  currentPage.drawText(unitInfo, {
    x: margin,
    y: pageHeight - 70,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Date
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  currentPage.drawText(`Generated on: ${dateStr}`, {
    x: margin,
    y: pageHeight - 85,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  currentY = tableStartY - 20

  // Draw header
  const drawHeader = (page: any, y: number) => {
    let x = margin
    page.drawRectangle({
      x: margin - 2,
      y: y - headerHeight + 5,
      width: pageWidth - margin * 2 + 4,
      height: headerHeight,
      color: rgb(0.9, 0.9, 0.9),
    })

    page.drawText("Name", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.name

    page.drawText("Email", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.email

    page.drawText("Mobile", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.mobile

    page.drawText("School", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.school

    page.drawText("Department", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.department

    page.drawText("Course", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.course

    page.drawText("Year", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.year

    page.drawText("Roll No", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    x += colWidths.roll

    page.drawText("Unit", {
      x: x,
      y: y - 10,
      size: headerFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
  }

  drawHeader(currentPage, currentY)
  currentY -= headerHeight + 5

  // Draw rows
  for (const volunteer of volunteers) {
    // Check if we need a new page
    if (currentY < margin + rowHeight) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      currentY = pageHeight - margin
      drawHeader(currentPage, currentY)
      currentY -= headerHeight + 5
    }

    // Draw row background (alternating)
    if (rowIndex % 2 === 0) {
      currentPage.drawRectangle({
        x: margin - 2,
        y: currentY - rowHeight + 2,
        width: pageWidth - margin * 2 + 4,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    // Draw row border
    currentPage.drawLine({
      start: { x: margin - 2, y: currentY },
      end: { x: pageWidth - margin + 2, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })

    let x = margin

    // Name (truncate if too long)
    const nameText = volunteer.name.length > 25 ? volunteer.name.substring(0, 22) + "..." : volunteer.name
    currentPage.drawText(nameText, {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.name

    // Email (truncate if too long)
    const emailText = volunteer.email.length > 30 ? volunteer.email.substring(0, 27) + "..." : volunteer.email
    currentPage.drawText(emailText, {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.email

    // Mobile
    currentPage.drawText(volunteer.mobileNo || "—", {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.mobile

    // School (truncate if too long)
    const schoolText = (volunteer.schoolName || "—").length > 25 ? (volunteer.schoolName || "—").substring(0, 22) + "..." : (volunteer.schoolName || "—")
    currentPage.drawText(schoolText, {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.school

    // Department (truncate if too long)
    const deptText = (volunteer.departmentName || "—").length > 25 ? (volunteer.departmentName || "—").substring(0, 22) + "..." : (volunteer.departmentName || "—")
    currentPage.drawText(deptText, {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.department

    // Course (truncate if too long)
    const courseText = (volunteer.courseName || "—").length > 20 ? (volunteer.courseName || "—").substring(0, 17) + "..." : (volunteer.courseName || "—")
    currentPage.drawText(courseText, {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.course

    // Year
    currentPage.drawText(volunteer.year || "—", {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.year

    // Roll Number
    currentPage.drawText(volunteer.rollNumber || "—", {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })
    x += colWidths.roll

    // Unit
    currentPage.drawText(volunteer.unitNo || "—", {
      x: x,
      y: currentY - 12,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    })

    currentY -= rowHeight
    rowIndex++
  }

  // Footer on last page
  const totalPages = pdfDoc.getPageCount()
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i)
    page.drawText(`Page ${i + 1} of ${totalPages}`, {
      x: pageWidth - margin - 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(`Total Volunteers: ${volunteers.length}`, {
      x: margin,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  return await pdfDoc.save()
}

