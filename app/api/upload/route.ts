import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name) || '.jpg'
  const fileName = `nss-${Date.now()}${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.join(uploadDir, fileName)
  const publicPath = `/uploads/${fileName}`

  try {
    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(filePath, buffer)
    return NextResponse.json({ success: true, path: publicPath })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to save file' }, { status: 500 })
  }
}
