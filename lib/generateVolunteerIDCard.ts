import { PDFDocument, rgb } from "pdf-lib"
import * as fs from "fs"
import * as path from "path"
import { toDataURL } from "qrcode"

interface IDCardData {
  // Personal Info
  name: string
  nameHindi?: string
  photo?: string
  signature?: string
  bloodGroup?: string
  email?: string
  mobileNo?: string
  
  // Institution Info
  institutionName: string
  schoolName?: string
  departmentName: string
  enrollment?: string
  institutionalIdCard?: string
  
  // Project Info
  projectName?: string
  role?: string
  
  // Address
  addressType?: "hostler" | "dayscholar" | string
  hostelAddress?: string
  homeAddress?: string
  
  // Coordinator Info
  coordinatorName?: string
  volunteerId?: string
}

function loadLocalFile(relPath: string) {
  return fs.readFileSync(path.join(process.cwd(), relPath))
}

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
    const p = src.startsWith("/") ? path.join(process.cwd(), "public", src) : path.join(process.cwd(), src)
    if (fs.existsSync(p)) return fs.readFileSync(p)
  } catch (e) {
    console.error("imageToBuffer error:", e)
  }
  return null
}

async function generateQRCode(data: string): Promise<Buffer> {
  try {
    const qrCodeDataUrl = await toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    const base64 = qrCodeDataUrl.split(",")[1] || ""
    return Buffer.from(base64, "base64")
  } catch (error) {
    console.error("QR Code generation error:", error)
    throw error
  }
}

export async function generateVolunteerIDCard(data: IDCardData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  
  // Standard ID card size: 85.6mm x 53.98mm = 324 x 204 points (at 72 DPI)
  const cardWidth = 324
  const cardHeight = 204
  
  // FRONT SIDE
  const frontPage = pdfDoc.addPage([cardWidth, cardHeight])
  
  // Load logos
  let collegeLogo: any = null
  let nssLogo: any = null
  let myBharatLogo: any = null
  
  try { collegeLogo = await pdfDoc.embedPng(loadLocalFile("public/1.png")) } catch {}
  try { nssLogo = await pdfDoc.embedPng(loadLocalFile("public/nssLogo.png")) } catch {}
  try { myBharatLogo = await pdfDoc.embedPng(loadLocalFile("public/myBharatLogo.png")) } catch {}
  
  // Background with gradient effect
  frontPage.drawRectangle({
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
    color: rgb(0.98, 0.98, 0.99),
  })
  
  // Top border with gradient effect
  frontPage.drawRectangle({
    x: 0,
    y: cardHeight - 35,
    width: cardWidth,
    height: 35,
    color: rgb(0.08, 0.25, 0.55),
  })
  
  // Logo section at top
  const logoSize = 28
  const logoSpacing = 60
  const logoStartX = 50
  const logoY = cardHeight - 32
  
  if (collegeLogo) {
    frontPage.drawImage(collegeLogo, { 
      x: logoStartX, 
      y: logoY, 
      width: logoSize, 
      height: logoSize 
    })
  }
  
  if (nssLogo) {
    frontPage.drawImage(nssLogo, { 
      x: logoStartX + logoSize + logoSpacing, 
      y: logoY, 
      width: logoSize, 
      height: logoSize 
    })
  }
  
  if (myBharatLogo) {
    frontPage.drawImage(myBharatLogo, { 
      x: logoStartX + (logoSize + logoSpacing) * 2, 
      y: logoY, 
      width: logoSize+10, 
      height: logoSize 
    })
  }
  
  // Title text BELOW logos
  frontPage.drawText("NSS VOLUNTEER", {
    x: 100,
    y: logoY - 16,
    size: 11,
    color: rgb(0, 0, 1),
  })
  
  frontPage.drawText("IDENTITY CARD", {
    x: 110,
    y: logoY - 30,
    size: 9,
    color: rgb(0, 0, 0.95),
  })
  
  // Photo area (right side, properly positioned)
  const photoX = cardWidth - 80
  const photoY = cardHeight - 140
  const photoW = 65
  const photoH = 80
  
  // Photo border with shadow effect
  frontPage.drawRectangle({
    x: photoX - 3,
    y: photoY - 3,
    width: photoW + 6,
    height: photoH + 6,
    borderWidth: 2,
    borderColor: rgb(0.08, 0.25, 0.55),
    color: rgb(1, 1, 1),
  })
  
  if (data.photo) {
    try {
      const buf = await imageToBuffer(data.photo)
      if (buf) {
        let photoImg
        try {
          photoImg = await pdfDoc.embedPng(buf)
        } catch {
          photoImg = await pdfDoc.embedJpg(buf)
        }
        frontPage.drawImage(photoImg, {
          x: photoX,
          y: photoY,
          width: photoW,
          height: photoH,
        })
      }
    } catch (e) {
      console.error("Photo embedding error:", e)
    }
  }
  
  // Content area (left side, below header)
  let currentY = cardHeight - 78
   frontPage.drawText("Name:", {
    x: 10,
    y: currentY,
    size: 10,
    color: rgb(0.5, 0, 0.5),
  })
  // Name (main, large, bold effect)
  const nameText = data.name.length > 30 ? data.name.substring(0, 27).toUpperCase() + "..." : data.name.toUpperCase()
  frontPage.drawText(nameText, {
    x: 60,
    y: currentY,
    size: 10,
    color: rgb(0.08, 0.08, 0.08),
  })
  
  // Institution Name
  currentY -= 16
  frontPage.drawText("Institution:", {
    x: 10,
    y: currentY,
    size: 10,
    color: rgb(0.5, 0, 0.5),
  })
  const instText = (data.institutionName || "").length > 35 
    ? (data.institutionName || "").substring(0, 32) + "..." 
    : (data.institutionName || "")
  frontPage.drawText(instText, {
    x: 60,
    y: currentY ,
    size: 10,
    color: rgb(0.1, 0.1, 0.1),
  })
  
  // School Name (if available)
  if (data.schoolName) {
    currentY -= 24
    frontPage.drawText("School:", {
      x: 10,
      y: currentY,
      size: 10,
      color: rgb(0.5, 0, 0.5),
    })
    const schoolText = data.schoolName.length > 35 
      ? data.schoolName.substring(0, 32) + "..." 
      : data.schoolName
    frontPage.drawText(schoolText, {
      x: 50,
      y: currentY,
      size: 10,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  
  // Department
  currentY -= (data.schoolName ? 24 : 16)
  frontPage.drawText("Department:", {
    x: 10,
    y: currentY,
    size: 10,
    color: rgb(0.5, 0, 0.5),
  })
  const deptText = data.departmentName.length > 35 
    ? data.departmentName.substring(0, 32) + "..." 
    : data.departmentName
  frontPage.drawText(deptText, {
    x: 68,
    y: currentY,
    size: 10,
    color: rgb(0.1, 0.1, 0.1),
  })
  
  // Roll Number / Enrollment
  if (data.institutionalIdCard) {
    currentY -= 24
    frontPage.drawText("Roll No:", {
      x: 10,
      y: currentY,
      size: 10,
      color: rgb(0.5, 0, 0.5),
    })
    frontPage.drawText(data.institutionalIdCard, {
      x: 60,
      y: currentY,
      size: 10,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  
  // Project Name
  if (data.projectName) {
    currentY -= 24
    frontPage.drawText("Project:", {
      x: 10,
      y: currentY,
      size: 10,
      color: rgb(0.5, 0, 0.5),
    })
    const projText = data.projectName.length > 35 
      ? data.projectName.substring(0, 32) + "..." 
      : data.projectName
    frontPage.drawText(projText, {
      x: 60,
      y: currentY,
      size: 10,
      color: rgb(0.1, 0.1, 0.1),
    })
  }
  
  // Role
  currentY -= 24
  frontPage.drawText("Role:", {
    x: 10,
    y: currentY,
    size: 10,
    color: rgb(0.5, 0, 0.5),
  })
  frontPage.drawText(data.role || "Volunteer", {
    x: 60,
    y: currentY,
    size: 10,
    color: rgb(0.08, 0.25, 0.55),
  })
  
  // // Bottom section - Blood Group and Address
  const bottomSectionY = 35
  
  // // Blood Group (left bottom)
  // if (data.bloodGroup) {
  //   frontPage.drawRectangle({
  //     x: 12,
  //     y: bottomSectionY - 18,
  //     width: 85,
  //     height: 18,
  //     borderWidth: 1,
  //     borderColor: rgb(0.8, 0.2, 0.2),
  //     color: rgb(1, 0.95, 0.95),
  //   })
  //   frontPage.drawText(`Blood Group: ${data.bloodGroup.toUpperCase()}`, {
  //     x: 18,
  //     y: bottomSectionY - 11,
  //     size: 8,
  //     color: rgb(0.8, 0.2, 0.2),
  //   })
  // }
  
  // // Address (left bottom, below blood group if exists)
  // const addressText = data.addressType === "hostler" 
  //   ? (data.hostelAddress || "")
  //   : data.addressType === "dayscholar"
  //   ? (data.homeAddress || "")
  //   : ""
  
  // if (addressText) {
  //   const addrStartY = data.bloodGroup ? bottomSectionY - 35 : bottomSectionY - 18
  //   const maxAddrLen = 42
  //   const addrLines = addressText.length > maxAddrLen 
  //     ? [
  //         addressText.substring(0, maxAddrLen),
  //         addressText.substring(maxAddrLen, maxAddrLen * 2)
  //       ].filter(l => l.length > 0)
  //     : [addressText]
    
  //   addrLines.forEach((line, idx) => {
  //     if (line) {
  //       frontPage.drawText(line, {
  //         x: 12,
  //         y: addrStartY - (idx * 12),
  //         size: 6.5,
  //         color: rgb(0.3, 0.3, 0.3),
  //       })
  //     }
  //   })
  // }
  
  // Signature (bottom right)
  if (data.signature) {
    try {
      const buf = await imageToBuffer(data.signature)
      if (buf) {
        let sigImg
        try {
          sigImg = await pdfDoc.embedPng(buf)
        } catch {
          sigImg = await pdfDoc.embedJpg(buf)
        }
        const sigW = 60
        const sigH = 18
        const sigX = cardWidth - sigW - 20
        const sigY = bottomSectionY - 8
        
        frontPage.drawRectangle({
          x: sigX - 1,
          y: sigY - 1,
          width: sigW + 2,
          height: sigH + 2,
          borderWidth: 1,
          borderColor: rgb(0.7, 0.7, 0.7),
        })
        
        frontPage.drawImage(sigImg, {
          x: sigX,
          y: sigY,
          width: sigW,
          height: sigH,
        })
        
        frontPage.drawText("Signature", {
          x: sigX+10,
          y: sigY - 12,
          size: 8,
          color: rgb(0.4, 0.4, 0.4),
        })
      }
    } catch (e) {
      console.error("Signature embedding error:", e)
    }
  }
  
  // Border around entire card
  frontPage.drawRectangle({
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
    borderWidth: 2,
    borderColor: rgb(0.08, 0.25, 0.55),
  })
  
  // BACK SIDE
  const backPage = pdfDoc.addPage([cardWidth, cardHeight])
  
  // Background
  backPage.drawRectangle({
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
    color: rgb(0.98, 0.98, 0.99),
  })
  
  // Header with gradient
  backPage.drawRectangle({
    x: 0,
    y: cardHeight - 40,
    width: cardWidth,
    height: 40,
    color: rgb(0.08, 0.25, 0.55),
  })
  
  backPage.drawText("GUIDELINES & INFORMATION", {
    x: 80,
    y: cardHeight - 25,
    size: 10,
    color: rgb(1, 1, 1),
  })
  
  // Content area below header
  const contentStartY = cardHeight - 55
  
  // Guidelines text (left side)
  const guidelines = [
    "1. This ID card is the property of the institution.",
    "2. Must be carried during NSS activities.",
    "3. Not transferable to any person.",
    "4. Report loss/damage immediately.",
    "5. Valid for current academic year only.",
  ]
  
  let guideY = contentStartY - 10
  guidelines.forEach((guideline) => {
    backPage.drawText(guideline, {
      x: 12,
      y: guideY,
      size: 7,
      color: rgb(0.1, 0.1, 0.1),
    })
    guideY -= 16
  })
  
  // QR Code section (right side, aligned with guidelines)
  const qrSize = 70
  const qrX = cardWidth - qrSize - 12
  const qrY = contentStartY
  
  try {
    // Generate QR code with volunteer information as URL
    const volunteerData = {
      name: data.name,
      email: data.email || "",
      mobile: data.mobileNo || "",
      institution: data.institutionName,
      department: data.departmentName,
      rollNo: data.institutionalIdCard || "",
      project: data.projectName || "",
      role: data.role || "Volunteer",
      id: data.volunteerId || "",
    }
    
    // Create URL with encoded JSON data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const encodedData = encodeURIComponent(JSON.stringify(volunteerData))
    const qrUrl = `${baseUrl}/qr/${encodedData}`
    
    const qrBuffer = await generateQRCode(qrUrl)
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    
    // QR code border
    backPage.drawRectangle({
      x: qrX - 2,
      y: qrY - qrSize ,
      width: qrSize + 2,
      height: qrSize + 2,
      borderWidth: 2,
      borderColor: rgb(0.08, 0.25, 0.55),
      color: rgb(1, 1, 1),
    })
    
    backPage.drawImage(qrImage, {
      x: qrX,
      y: qrY - qrSize+2,
      width: qrSize-2,
      height: qrSize-2,
    })
    
    // backPage.drawText("Scan for Details", {
    //   x: qrX + 8,
    //   y: qrY - qrSize - 12,
    //   size: 6.5,
    //   color: rgb(0.4, 0.4, 0.4),
    // })
  } catch (error) {
    console.error("QR Code generation error:", error)
  }
  
  // Coordinator section (bottom)
  backPage.drawLine({
    start: { x: 12, y: 65 },
    end: { x: cardWidth - 12, y: 65 },
    thickness: 1.5,
    color: rgb(0.08, 0.25, 0.55),
  })
  
  backPage.drawText("Project Coordinator", {
    x: 20,
    y: 35,
    size: 8,
    color: rgb(0.5, 0, 0.5),
  })
  
  if (data.coordinatorName) {
    backPage.drawText(data.coordinatorName.toUpperCase(), {
      x: 25,
      y: 20,
      size: 10,
      color: rgb(0.08, 0.08, 0.08),
    })
  }
  
  // Coordinator signature
  let coordSign: any = null
  try {
    coordSign = await pdfDoc.embedPng(loadLocalFile("public/coordinatorSign.png"))
  } catch {}
  
  if (coordSign) {
    backPage.drawImage(coordSign, {
      x: cardWidth - 75,
      y: 28,
      width: 65,
      height: 28,
    })
  }
  
  backPage.drawText("Signature", {
    x: cardWidth - 65,
    y: 20,
    size: 8,
    color: rgb(0.4, 0.4, 0.4),
  })
  
  // Watermark (subtle)
  backPage.drawText("NSS", {
    x: cardWidth / 2 - 18,
    y: cardHeight / 2 - 8,
    size: 42,
    color: rgb(0.96, 0.96, 0.96),
  })
  
  // Border around entire card
  backPage.drawRectangle({
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
    borderWidth: 2,
    borderColor: rgb(0.08, 0.25, 0.55),
  })
  
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
