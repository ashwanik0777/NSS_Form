import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { sendCustomEmail } from "@/lib/email"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { hasPermission, PermissionKey } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "users.view" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 })
      }
    }

    await dbConnect()

    // Fetch admins and sub-admins; filter sub-admins with permissions later to avoid invalid $size usage
    const allUsers = await User.find({
      role: { $in: ["admin", "sub-admin"] },
    })
      .select("-password")
      .sort({ createdAt: -1 })

    const users = allUsers.filter((user: any) => {
      if (user.role === "admin") {
        return true
      }
      return Array.isArray(user.permissions) && user.permissions.length > 0
    })

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.role !== "sub-admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check permission for sub-admin - require users.create
    if (session.user.role === "sub-admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, "users.create" as PermissionKey)) {
        return NextResponse.json({ success: false, message: "Permission denied. You need 'users.create' permission." }, { status: 403 })
      }
    }

    await dbConnect()

    const body = await request.json()
    const { name, email, role, hierarchy, permissions, password, assignedUnits } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "Name, email, and role are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    
    if (existingUser) {
      // Update existing user (Promotion/Role Change)
      existingUser.role = role
      existingUser.permissions = permissions || []
      existingUser.hierarchy = hierarchy || ""
      existingUser.assignedUnits = assignedUnits || []
      
      // Only update name if provided
      if (name) existingUser.name = name
      
      // DO NOT update password for existing users to preserve their login
      // DO NOT change mustChangePassword
      
      await existingUser.save()
      
      // Send email notification about role update
      try {
        await sendCustomEmail(
          email,
          "NSS Role Updated",
          `Dear ${name},\n\nYour role in the NSS system has been updated to ${role}${hierarchy ? ` (${hierarchy})` : ""}.\n\nYou can continue to login with your existing credentials.\n\nNew Permissions have been assigned to your account.\n\nBest regards,\nNSS Administration Team`
        )
      } catch (emailError) {
        console.error("Error sending email:", emailError)
      }

      return NextResponse.json({
        success: true,
        message: "User role updated successfully",
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          permissions: existingUser.permissions,
          assignedUnits: existingUser.assignedUnits,
          hierarchy: existingUser.hierarchy
        },
      })
    }

    // Use provided password or generate temporary
    let finalPassword: string
    let mustChangePassword = false
    if (password && password.trim().length >= 6) {
      finalPassword = password
      mustChangePassword = false // If password provided, no need to change
    } else {
      finalPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
      mustChangePassword = true // Must change on first login
    }
    const hashedPassword = await bcrypt.hash(finalPassword, 12)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      hierarchy: hierarchy || undefined,
      permissions: permissions || [],
      assignedUnits: assignedUnits || [],
      mustChangePassword,
      status: "accepted", // Sub-admin is auto-accepted
    })

    await user.save()

    // Send email with login credentials
    try {
      await sendCustomEmail(
        email,
        "NSS Sub-Admin Account Created",
        `Dear ${name},\n\nYour NSS Sub-Admin account has been created successfully.\n\nLogin Details:\nEmail: ${email}\nPassword: ${finalPassword}\n\n${mustChangePassword ? "Please change your password after first login for security." : ""}\n\nAssigned Units: ${(assignedUnits || []).length > 0 ? assignedUnits.join(", ") : "All Units"}\n\nYou can now login at: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login\n\nBest regards,\nNSS Administration Team`
      )
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // Don't fail user creation if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        assignedUnits: user.assignedUnits,
      },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
