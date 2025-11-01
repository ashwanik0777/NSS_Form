import { NextRequest, NextResponse } from 'next/server'
import { generateNSSApplicationPDF } from '@/lib/generateNSSApplicationPDF'
import dbConnect from '@/lib/mongodb'
import NSSApplication from '@/models/NSSApplication'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    
    const pdfBytes = await generateNSSApplicationPDF(formData)
    
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NSS_Application_${formData.formNo || 'form'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('id')
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    await dbConnect()
    const application = await NSSApplication.findById(applicationId).lean()
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if user owns this application or is admin
    if (application.userId?.toString() !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'sub-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Convert application to formData format
    const appData = application as any
    const formData = {
      institutionName: application.institutionName,
      formNo: application.formNo,
      enrollment: application.enrollment,
      programOfficerName: application.programOfficerName,
      unitNo: application.unitNo,
      schoolName: appData.schoolName || '',
      nameEnglish: application.nameEnglish,
      nameHindi: appData.nameHindi || application.nameEnglish,
      fatherName: application.fatherName,
      motherName: application.motherName,
      dateOfBirth: application.dateOfBirth?.toISOString().split('T')[0] || '',
      mobileNo: application.mobileNo,
      emailId: application.emailId,
      departmentName: application.departmentName || '',
      courseName: appData.courseName || '',
      gender: application.gender || '',
      category: application.category || '',
      institutionalIdCard: application.institutionalIdCard || '',
      photo: application.photo || '',
      signature: application.signature || '',
      highSchoolRollNo: application.highSchoolRollNo,
      classSemester: application.classSemester,
      bloodGroup: appData.bloodGroup || '',
      nssEnrollmentYear: application.nssEnrollmentYear || '',
      attendedSpecialCamp: application.attendedSpecialCamp || false,
      specialCampDetails: application.specialCampDetails || undefined,
      myBharatPortalRegistered: application.myBharatPortalRegistered || false,
      myBharatPortalId: appData.myBharatPortalId || '',
      myBharatPortalScreenshot: appData.myBharatPortalScreenshot || '',
      specialNSSAchievements: appData.specialNSSAchievements || 'No',
      specialNSSAchievementsProof: appData.specialNSSAchievementsProof || null,
      attendedELP: application.attendedELP || false,
      elpProof: appData.elpProof || null,
      otherAchievements: appData.otherAchievements || 'No',
      otherAchievementsCertificates: appData.otherAchievementsCertificates || null,
      addressType: appData.addressType || '',
      hostelAddress: appData.hostelAddress || '',
      homeAddress: appData.homeAddress || '',
      highSchoolCertificate: appData.highSchoolCertificate || '',
    }
    
    const pdfBytes = await generateNSSApplicationPDF(formData)
    
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NSS_Application_${application.formNo || 'form'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}