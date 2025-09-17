import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import type { FormData } from './types';

// Helper to load image as Uint8Array
function loadImage(filePath: string) {
	return fs.readFileSync(path.resolve(process.cwd(), filePath));
}

export async function generateNSSApplicationPDF(formData: FormData): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	// Load Noto Sans Devanagari font (supports both Hindi and English)
	const notoFontBytes = loadImage('public/fonts/NotoSansDevanagari-Regular.ttf');
	const font = await pdfDoc.embedFont(notoFontBytes);

	// Load logos
	const logo1 = await pdfDoc.embedPng(loadImage('public/1.png'));
	const logo2 = await pdfDoc.embedPng(loadImage('public/myBharatLogo.png'));
	const logo3 = await pdfDoc.embedPng(loadImage('public/nssLogo.png'));

	// Helper for drawing text
	const drawText = (page: any, text: string, x: number, y: number, size = 12, opts = {}) => {
		page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0), ...opts });
	};

	// PAGE 1: Logos and Institution/Personal Details
	const page1 = pdfDoc.addPage([595, 842]); // A4 portrait
	// Draw logos at top
	page1.drawImage(logo1, { x: 40, y: 770, width: 60, height: 60 });
	page1.drawImage(logo2, { x: 267, y: 770, width: 60, height: 60 });
	page1.drawImage(logo3, { x: 495, y: 770, width: 60, height: 60 });
	drawText(page1, 'NSS Volunteer Application Form', 150, 750, 20, { color: rgb(0.1,0.1,0.5) });
	drawText(page1, 'Institution Details', 50, 720, 14);
	drawText(page1, `Institution Name: ${formData.institutionName}`, 50, 700);
	drawText(page1, `Form Number: ${formData.formNo}`, 320, 700);
	drawText(page1, `Enrollment: ${formData.enrollment}`, 50, 680);
	drawText(page1, `Programme Officer: ${formData.programOfficerName}`, 320, 680);
	drawText(page1, `Unit Number: ${formData.unitNo}`, 50, 660);

	drawText(page1, 'Personal Details', 50, 630, 14);
	drawText(page1, `Name (English): ${formData.nameEnglish}`, 50, 610);
	drawText(page1, `Name (Hindi): ${formData.nameHindi}`, 320, 610);
	drawText(page1, `Father's Name: ${formData.fatherName}`, 50, 590);
	drawText(page1, `Mother's Name: ${formData.motherName}`, 320, 590);
	drawText(page1, `DOB: ${formData.dateOfBirth}`, 50, 570);
	drawText(page1, `Mobile: ${formData.mobileNo}`, 320, 570);
	drawText(page1, `Email: ${formData.emailId}`, 50, 550);
	drawText(page1, `Department: ${formData.departmentName}`, 320, 550);
	drawText(page1, `Gender: ${formData.gender}`, 50, 530);
	drawText(page1, `Category: ${formData.category}`, 320, 530);
	drawText(page1, `Institutional I-Card No: ${formData.institutionalIdCard}`, 50, 510);

	// Student photo (if available)
	if (formData.photo && typeof formData.photo === 'string') {
		try {
			const photoImg = await pdfDoc.embedJpg(loadImage(formData.photo));
			page1.drawImage(photoImg, { x: 480, y: 600, width: 80, height: 100 });
			drawText(page1, 'Student Photo', 490, 590, 10);
		} catch {}
	}

	// PAGE 2: Educational, NSS, Achievements
	const page2 = pdfDoc.addPage([595, 842]);
	drawText(page2, 'Educational Details', 50, 800, 14);
	drawText(page2, `High School Roll No: ${formData.highSchoolRollNo}`, 50, 780);
	drawText(page2, `Class/Semester: ${formData.classSemester}`, 320, 780);

	drawText(page2, 'NSS Details', 50, 750, 14);
	drawText(page2, `NSS Enrollment Year: ${formData.nssEnrollmentYear}`, 50, 730);
	drawText(page2, `Attended 07-Day Special Camp: ${formData.attendedSpecialCamp ? 'Yes' : 'No'}`, 320, 730);
	if (formData.attendedSpecialCamp && formData.specialCampDetails) {
		drawText(page2, `Village/Slum: ${formData.specialCampDetails.villageName}`, 50, 710);
		drawText(page2, `Camp Date: ${formData.specialCampDetails.date}`, 320, 710);
		drawText(page2, `Venue: ${formData.specialCampDetails.venue}`, 50, 690);
	}
	drawText(page2, `My Bharat Portal Registered: ${formData.myBharatPortalRegistered ? 'Yes' : 'No'}`, 50, 670);

	drawText(page2, 'Achievements', 50, 640, 14);
	drawText(page2, `Special NSS Achievements: ${formData.specialNSSAchievements || '-'}`, 50, 620);
	drawText(page2, `Attended ELP: ${formData.attendedELP ? 'Yes' : 'No'}`, 50, 600);
	drawText(page2, `Other Achievements: ${formData.otherAchievements || '-'}`, 50, 580);

	// PAGE 3: Declaration and Signatures
	const page3 = pdfDoc.addPage([595, 842]);
	drawText(page3, 'Self Declaration / स्वयं घोषणा', 50, 800, 16);
	drawText(page3, 'I hereby declare that the information furnished above is true to the best of my knowledge and belief. If any information is found incorrect, my enrolment shall be cancelled.', 50, 770, 12, { maxWidth: 495 });
	drawText(page3, 'मैं घोषणा करता / करती हूँ कि मेरे द्वारा दी गई उपरोक्त जानकारी मेरी जानकारी और विश्वास के अनुसार सही है। यदि कोई जानकारी गलत पाई जाती है, तो मेरा नामांकन रद्द कर दिया जाएगा।', 50, 750, 12, { maxWidth: 495 });


	// Signature boxes
	drawText(page3, 'Signature of Student', 70, 200, 12);
	drawText(page3, 'कार्यक्रम अधिकारी का हस्ताक्षर', 370, 200, 12);

	// Student photo again (if available)
	if (formData.photo && typeof formData.photo === 'string') {
		try {
			const photoImg = await pdfDoc.embedJpg(loadImage(formData.photo));
			page3.drawImage(photoImg, { x: 70, y: 230, width: 80, height: 100 });
		} catch {}
	}

	// Student signature (if available)
	if (formData.signature && typeof formData.signature === 'string') {
		try {
			const signImg = await pdfDoc.embedPng(loadImage(formData.signature));
			page3.drawImage(signImg, { x: 70, y: 170, width: 80, height: 40 });
		} catch {}
	}

	return await pdfDoc.save();
}
