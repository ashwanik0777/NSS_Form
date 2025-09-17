import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from 'fontkit'
import fs from 'fs'
import path from 'path'

// Helper to fetch image as Uint8Array
async function fetchImageAsBytes(imagePath: string) {
  return fs.promises.readFile(imagePath)
}

export async function generateNSSApplicationPDF(formData: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const page1 = pdfDoc.addPage([595, 842]) // A4 portrait
  const page2 = pdfDoc.addPage([595, 842])
  const page3 = pdfDoc.addPage([595, 842])

  // Load logos
  const logo1 = await fetchImageAsBytes(path.join(process.cwd(), 'public/1.png'))
  const logo2 = await fetchImageAsBytes(path.join(process.cwd(), 'public/myBharatLogo.png'))
  const logo3 = await fetchImageAsBytes(path.join(process.cwd(), 'public/nssLogo.png'))
  const logo1Embed = await pdfDoc.embedPng(logo1)
  const logo2Embed = await pdfDoc.embedPng(logo2)
  const logo3Embed = await pdfDoc.embedPng(logo3)

  // Student photo (optional)
  let studentPhotoEmbed = null
  if (formData.photo) {
    try {
      const photoBytes = Buffer.isBuffer(formData.photo)
        ? formData.photo
        : Buffer.from(formData.photo.split(',')[1], 'base64')
      studentPhotoEmbed = await pdfDoc.embedJpg(photoBytes)
    } catch {}
  }

  // Fonts: Use Unicode font for Hindi/Devanagari support
  const notoFontBytes = await fs.promises.readFile(path.join(process.cwd(), 'public/NotoSansDevanagari-Regular.ttf'))
  const font = await pdfDoc.embedFont(notoFontBytes)

  // --- PAGE 1: Logos and Institution/Personal Details ---
  page1.drawImage(logo1Embed, { x: 40, y: 770, width: 60, height: 60 })
  page1.drawImage(logo2Embed, { x: 260, y: 770, width: 60, height: 60 })
  page1.drawImage(logo3Embed, { x: 495, y: 770, width: 60, height: 60 })
  page1.drawText('NSS Volunteer Registration Form', { x: 120, y: 800, size: 18, font, color: rgb(0,0,0) })
  page1.drawText('Institution Details:', { x: 40, y: 740, size: 14, font })
  page1.drawText(`Institution Name: ${formData.institutionName || ''}`, { x: 60, y: 720, size: 12, font })
  page1.drawText(`Form Number: ${formData.formNo || ''}`, { x: 60, y: 705, size: 12, font })
  page1.drawText(`Enrollment: ${formData.enrollment || ''}`, { x: 60, y: 690, size: 12, font })
  page1.drawText(`Programme Officer: ${formData.programOfficerName || ''}`, { x: 60, y: 675, size: 12, font })
  page1.drawText(`Unit Number: ${formData.unitNo || ''}`, { x: 60, y: 660, size: 12, font })
  page1.drawText('Personal Details:', { x: 40, y: 640, size: 14, font })
  page1.drawText(`Name (English): ${formData.nameEnglish || ''}`, { x: 60, y: 620, size: 12, font })
  page1.drawText(`Name (Hindi): ${formData.nameHindi || ''}`, { x: 60, y: 605, size: 12, font })
  page1.drawText(`Father's Name: ${formData.fatherName || ''}`, { x: 60, y: 590, size: 12, font })
  page1.drawText(`Mother's Name: ${formData.motherName || ''}`, { x: 60, y: 575, size: 12, font })
  page1.drawText(`Date of Birth: ${formData.dateOfBirth || ''}`, { x: 60, y: 560, size: 12, font })
  page1.drawText(`Mobile No: ${formData.mobileNo || ''}`, { x: 60, y: 545, size: 12, font })
  page1.drawText(`Email ID: ${formData.emailId || ''}`, { x: 60, y: 530, size: 12, font })
  page1.drawText(`Department: ${formData.departmentName || ''}`, { x: 60, y: 515, size: 12, font })
  page1.drawText(`Gender: ${formData.gender || ''}`, { x: 60, y: 500, size: 12, font })
  page1.drawText(`Category: ${formData.category || ''}`, { x: 60, y: 485, size: 12, font })
  page1.drawText(`Institutional I-Card No: ${formData.institutionalIdCard || ''}`, { x: 60, y: 470, size: 12, font })
  if (studentPhotoEmbed) {
    page1.drawImage(studentPhotoEmbed, { x: 450, y: 600, width: 100, height: 120 })
    page1.drawText('Student Photo', { x: 470, y: 590, size: 10, font })
  }

  // --- PAGE 2: Educational, NSS, Achievements ---
  page2.drawText('Educational Details:', { x: 40, y: 800, size: 14, font })
  page2.drawText(`High School Roll No: ${formData.highSchoolRollNo || ''}`, { x: 60, y: 780, size: 12, font })
  page2.drawText(`Class/Semester: ${formData.classSemester || ''}`, { x: 60, y: 765, size: 12, font })
  page2.drawText('NSS & Additional Details:', { x: 40, y: 740, size: 14, font })
  page2.drawText(`NSS Enrollment Year: ${formData.nssEnrollmentYear || ''}`, { x: 60, y: 720, size: 12, font })
  page2.drawText(`Attended 07-Day Special Camp: ${formData.attendedSpecialCamp ? 'Yes' : 'No'}`, { x: 60, y: 705, size: 12, font })
  if (formData.attendedSpecialCamp && formData.specialCampDetails) {
    page2.drawText(`Village/Slum: ${formData.specialCampDetails.villageName || ''}`, { x: 80, y: 690, size: 12, font })
    page2.drawText(`Camp Date: ${formData.specialCampDetails.date || ''}`, { x: 80, y: 675, size: 12, font })
    page2.drawText(`Camp Venue: ${formData.specialCampDetails.venue || ''}`, { x: 80, y: 660, size: 12, font })
  }
  page2.drawText(`My Bharat Portal Registered: ${formData.myBharatPortalRegistered ? 'Yes' : 'No'}`, { x: 60, y: 640, size: 12, font })
  if (formData.specialNSSAchievements) {
    page2.drawText(`Special NSS Achievements: ${formData.specialNSSAchievements}`, { x: 60, y: 620, size: 12, font })
  }
  page2.drawText(`Attended ELP: ${formData.attendedELP ? 'Yes' : 'No'}`, { x: 60, y: 600, size: 12, font })
  if (formData.otherAchievements) {
    page2.drawText(`Other Achievements: ${formData.otherAchievements}`, { x: 60, y: 580, size: 12, font })
  }

  // --- PAGE 3: Declaration & Signatures ---
  page3.drawText('Self Declaration / स्वयं घोषणा', { x: 40, y: 800, size: 14, font })
  page3.drawText('I hereby declare that the information furnished above is true to the best of my knowledge and belief. If any information is found incorrect, my enrolment shall be cancelled.', { x: 60, y: 780, size: 12, font, maxWidth: 480, lineHeight: 16 })
  page3.drawText('मैं घोषणा करता / करती हूँ कि मेरे द्वारा दी गई उपरोक्त जानकारी मेरी जानकारी और विश्वास के अनुसार सही है। यदि कोई जानकारी गलत पाई जाती है, तो मेरा नामांकन रद्द कर दिया जाएगा।', { x: 60, y: 760, size: 12, font, maxWidth: 480, lineHeight: 16 })
  // Signature boxes
  page3.drawText('Signature of Student', { x: 60, y: 200, size: 12, font })
  page3.drawText('कार्यक्रम अधिकारी का हस्ताक्षर', { x: 350, y: 200, size: 12, font })
  page3.drawRectangle({ x: 60, y: 170, width: 180, height: 25, borderColor: rgb(0,0,0), borderWidth: 1 })
  page3.drawRectangle({ x: 350, y: 170, width: 180, height: 25, borderColor: rgb(0,0,0), borderWidth: 1 })

  return await pdfDoc.save()
}
