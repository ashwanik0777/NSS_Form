import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

interface VolunteerRow {
  name: string
  fatherName: string
  motherName: string
  email: string
  mobileNo: string
  dob: string
  gender: string
  category: string
  bloodGroup: string
  schoolName: string
  departmentName: string
  courseName: string
  year: string
  rollNumber: string
  unitNo: string
  programOfficerName: string
  highSchoolRollNo: string
  classSemester: string
  nssEnrollmentYear: string
  addressType: string
  hostelAddress: string
  homeAddress: string
  myBharatRegistered: string
  myBharatPortalId: string
  attendedSpecialCamp: string
  attendedELP: string
}

export async function generateVolunteerExportPDF(
  volunteers: VolunteerRow[],
  unitInfo: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Landscape A3 size for more width
  const pageWidth = 1190.55 // A3 Landscape width
  const pageHeight = 841.89 // A3 Landscape height
  const margin = 30
  const tableStartY = pageHeight - 100
  const rowHeight = 25
  const headerHeight = 35
  const fontSize = 8
  const headerFontSize = 9

  // Column widths - adjusted for more columns
  const colWidths = {
    name: 70,
    fatherName: 70,
    email: 90,
    mobile: 55,
    dob: 45,
    gender: 35,
    category: 35,
    school: 60,
    department: 60,
    course: 50,
    year: 30,
    roll: 50,
    unit: 25,
    address: 80,
    myBharat: 30,
    camp: 30,
    programOfficer: 60,
    hsRoll: 50,
    sem: 30,
    nssYear: 30,
    mbId: 50,
    elp: 30,
  }

  let currentY = tableStartY
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let rowIndex = 0

  // Title
  currentPage.drawText("NSS Volunteers Detailed Export", {
    x: margin,
    y: pageHeight - 50,
    size: 18,
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

    const headers = [
      { text: "Name", width: colWidths.name },
      { text: "Father Name", width: colWidths.fatherName },
      { text: "Email", width: colWidths.email },
      { text: "Mobile", width: colWidths.mobile },
      { text: "DOB", width: colWidths.dob },
      { text: "Gender", width: colWidths.gender },
      { text: "Category", width: colWidths.category },
      { text: "School", width: colWidths.school },
      { text: "Department", width: colWidths.department },
      { text: "Course", width: colWidths.course },
      { text: "Year", width: colWidths.year },
      { text: "Roll No", width: colWidths.roll },
      { text: "Unit", width: colWidths.unit },
      { text: "PO Name", width: colWidths.programOfficer },
      { text: "HS Roll", width: colWidths.hsRoll },
      { text: "Sem", width: colWidths.sem },
      { text: "NSS Yr", width: colWidths.nssYear },
      { text: "Address", width: colWidths.address },
      { text: "MyBharat", width: colWidths.myBharat },
      { text: "MB ID", width: colWidths.mbId },
      { text: "Camp", width: colWidths.camp },
      { text: "ELP", width: colWidths.elp },
    ]

    headers.forEach(h => {
      page.drawText(h.text, {
        x: x,
        y: y - 10,
        size: headerFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      x += h.width
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

    const drawCell = (text: string, width: number) => {
      const truncated = text.length > width / 4 ? text.substring(0, Math.floor(width / 4) - 2) + ".." : text
      currentPage.drawText(truncated || "—", {
        x: x,
        y: currentY - 12,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
      x += width
    }

    drawCell(volunteer.name, colWidths.name)
    drawCell(volunteer.fatherName, colWidths.fatherName)
    drawCell(volunteer.email, colWidths.email)
    drawCell(volunteer.mobileNo, colWidths.mobile)
    drawCell(volunteer.dob, colWidths.dob)
    drawCell(volunteer.gender, colWidths.gender)
    drawCell(volunteer.category, colWidths.category)
    drawCell(volunteer.schoolName, colWidths.school)
    drawCell(volunteer.departmentName, colWidths.department)
    drawCell(volunteer.courseName, colWidths.course)
    drawCell(volunteer.year, colWidths.year)
    drawCell(volunteer.rollNumber, colWidths.roll)
    drawCell(volunteer.unitNo, colWidths.unit)
    drawCell(volunteer.programOfficerName, colWidths.programOfficer)
    drawCell(volunteer.highSchoolRollNo, colWidths.hsRoll)
    drawCell(volunteer.classSemester, colWidths.sem)
    drawCell(volunteer.nssEnrollmentYear, colWidths.nssYear)
    
    // Address logic
    const address = volunteer.addressType === "hostler" ? volunteer.hostelAddress : volunteer.homeAddress
    drawCell(address, colWidths.address)
    
    drawCell(volunteer.myBharatRegistered, colWidths.myBharat)
    drawCell(volunteer.myBharatPortalId, colWidths.mbId)
    drawCell(volunteer.attendedSpecialCamp, colWidths.camp)
    drawCell(volunteer.attendedELP, colWidths.elp)

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

