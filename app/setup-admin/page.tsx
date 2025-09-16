"use client"

import { useState } from "react"
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; credentials?: any } | null>(null)

  const handleSetupAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/seed-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          credentials: data.credentials,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to setup admin",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Shield className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-2">Setup Admin</h2>
          <p className="text-lg text-muted-foreground">Initialize NSS Admin User</p>
        </div>

        <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8">
          {!result ? (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                Click the button below to create the admin user for the NSS system.
              </p>

              <button
                onClick={handleSetupAdmin}
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Setup Admin User
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg ${
                  result.success
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <p className="font-medium">{result.message}</p>
              </div>

              {result.success && result.credentials && (
                <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-6 border border-border/30">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-primary" />
                    Admin Credentials
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Email:</span> {result.credentials.email}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Password:</span> {result.credentials.password}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center">
                <a
                  href="/login"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Go to Login
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
