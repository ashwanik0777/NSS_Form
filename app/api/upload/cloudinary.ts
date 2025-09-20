import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // Convert buffer to base64 for Cloudinary upload
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`
    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: 'nss-registration',
      resource_type: 'image',
    })
    return NextResponse.json({ success: true, path: uploadRes.secure_url })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload to Cloudinary' }, { status: 500 })
  }
}
