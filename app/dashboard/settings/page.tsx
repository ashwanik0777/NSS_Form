"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings as SettingsIcon, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 mr-3 text-primary" />
          Settings
        </h1>

        <div className="space-y-4">
          <Link
            href="/dashboard/change-password"
            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center">
              <Lock className="w-5 h-5 mr-3 text-primary" />
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}

