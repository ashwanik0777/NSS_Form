import { NextRequest, NextResponse } from 'next/server'
import { generateNSSApplicationPDF } from '@/lib/generateNSSApplicationPDF'

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