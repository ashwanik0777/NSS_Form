import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

interface ExportColumn {
  key: string
  label: string
}

export async function generateVolunteerExportPDF(
  volunteers: Record<string, string>[],
  unitInfo: string,
  columns?: ExportColumn[]
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

  // If no columns provided, derive from the first row keys (backward compat)
  const cols: ExportColumn[] = columns || (
    volunteers.length > 0
      ? Object.keys(volunteers[0]).map(key => ({ key, label: key }))
      : []
  )

  if (cols.length === 0) {
    // No data — return empty PDF
    pdfDoc.addPage([pageWidth, pageHeight])
    return await pdfDoc.save()
  }

  // Auto-distribute column widths based on count
  const usableWidth = pageWidth - margin * 2
  const colCount = cols.length

  // Give wider columns to fields that typically have more text
  const wideFields = new Set(["name", "email", "schoolName", "departmentName", "hostelAddress", "homeAddress", "programOfficerName", "specialNSSAchievements", "otherAchievements", "fatherName", "motherName", "courseName"])
  const narrowFields = new Set(["gender", "category", "unitNo", "year", "myBharatRegistered", "attendedSpecialCamp", "attendedELP", "classSemester", "nssEnrollmentYear", "totalHours", "eventHours", "meetingHours", "totalEvents", "completedEvents", "attendanceRate", "activeProjects", "bloodGroup"])

  // Calculate weighted width
  let totalWeight = 0
  const weights: number[] = cols.map(col => {
    let w = 2  // normal
    if (wideFields.has(col.key)) w = 3
    if (narrowFields.has(col.key)) w = 1.2
    totalWeight += w
    return w
  })

  const colWidths = weights.map(w => (w / totalWeight) * usableWidth)

  let currentY = tableStartY
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let rowIndex = 0

  // Title
  currentPage.drawText("NSS Volunteers Export", {
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
      width: usableWidth + 4,
      height: headerHeight,
      color: rgb(0.9, 0.9, 0.9),
    })

    cols.forEach((col, i) => {
      const truncated = col.label.length > colWidths[i] / 4
        ? col.label.substring(0, Math.floor(colWidths[i] / 4) - 1) + ".."
        : col.label
      page.drawText(truncated, {
        x: x,
        y: y - 10,
        size: headerFontSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      x += colWidths[i]
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
        width: usableWidth + 4,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    // Draw row border
    currentPage.drawLine({
      start: { x: margin - 2, y: currentY },
      end: { x: margin + usableWidth + 2, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })

    let x = margin

    cols.forEach((col, i) => {
      const value = volunteer[col.key] || "—"
      const maxChars = Math.max(3, Math.floor(colWidths[i] / 4))
      const truncated = value.length > maxChars ? value.substring(0, maxChars - 2) + ".." : value
      currentPage.drawText(truncated, {
        x: x,
        y: currentY - 12,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
      x += colWidths[i]
    })

    currentY -= rowHeight
    rowIndex++
  }

  // Footer on all pages
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
