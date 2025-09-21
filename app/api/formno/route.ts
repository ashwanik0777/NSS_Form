import dbConnect from "@/lib/mongodb"
import NSSApplication from "@/models/NSSApplication"
import { NextResponse } from "next/server"

export const runtime = 'nodejs'

export async function GET() {
  await dbConnect()
  // Find the max formNo (as integer) and return next
  // If no applications, start from 1001
  const lastApp: any = await NSSApplication.findOne({}, { formNo: 1 })
    .sort({ formNo: -1 })
    .lean()
  let nextFormNo = 1001
  if (lastApp && lastApp.formNo && !isNaN(Number(lastApp.formNo))) {
    nextFormNo = Number(lastApp.formNo) + 1
  }
  return NextResponse.json({ nextFormNo: String(nextFormNo) })
}
