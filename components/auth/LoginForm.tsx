"use client"

import type React from "react"
import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // Get session to check user role
        const session = await getSession()
        if (session?.user?.role === "admin" || session?.user?.role === "sub-admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl hover-lift">
            <Shield className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-2">NSS Admin Login</h2>
          <p className="text-lg text-muted-foreground mb-1">National Service Scheme - Uttar Pradesh</p>
          <p className="text-sm text-muted-foreground">राष्ट्रीय सेवा योजना - उत्तर प्रदेश</p>
        </div>

        <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="flex items-center text-sm font-semibold text-foreground mb-3">
                  <Mail className="w-4 h-4 mr-2 text-primary" />
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 hover:border-primary/30"
                  placeholder="Enter your admin email"
                />
              </div>

              <div>
                <label htmlFor="password" className="flex items-center text-sm font-semibold text-foreground mb-3">
                  <Lock className="w-4 h-4 mr-2 text-primary" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 hover:border-primary/30"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Sign in to Admin Panel
                </>
              )}
            </button>

            <div className="text-center">
              <a
                href="/register"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
              >
                Apply for NSS Registration →
              </a>
            </div>
          </form>
        </div>

        {/* <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-6 border border-border/30">
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Admin Credentials
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Email:</span> admin@nss.gov.in
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Password:</span> admin123
            </p>
          </div>
        </div> */}

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Government of India | भारत सरकार</p>
          <p>National Service Scheme - Uttar Pradesh</p>
        </div>
      </div>
    </div>
  )
}
