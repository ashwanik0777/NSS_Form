"use client"

import type React from "react"
import { useState } from "react"
import { signIn, getSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    loginAs: "volunteer", 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotData, setForgotData] = useState({
    name: "",
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  })
  const router = useRouter()

  const openForgot = () => {
    if (formData.loginAs !== "volunteer") {
      setError("Forgot password is available only for Volunteer login.")
      return
    }
    setError("")
    setForgotOpen(true)
  }

  const closeForgot = () => {
    setForgotOpen(false)
    setForgotStep(1)
    setForgotLoading(false)
    setForgotError("")
    setForgotMessage("")
    setForgotData({ name: "", email: "", otp: "", newPassword: "", confirmPassword: "" })
  }

  const handleSendOtp = async () => {
    setForgotError("")
    setForgotMessage("")
    if (!forgotData.name.trim() || !forgotData.email.trim()) {
      setForgotError("Please enter your name and email.")
      return
    }
    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: forgotData.name, email: forgotData.email }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setForgotError(data?.message || "Failed to send OTP")
        return
      }
      setForgotMessage(data?.message || "OTP sent successfully")
      setForgotStep(2)
    } catch {
      setForgotError("Failed to send OTP")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setForgotError("")
    setForgotMessage("")
    if (!forgotData.otp.trim()) {
      setForgotError("Please enter OTP")
      return
    }
    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotData.email, otp: forgotData.otp }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setForgotError(data?.message || "OTP verification failed")
        return
      }
      setForgotMessage(data?.message || "OTP verified")
      setForgotStep(3)
    } catch {
      setForgotError("OTP verification failed")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setForgotError("")
    setForgotMessage("")
    if (!forgotData.newPassword || forgotData.newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters")
      return
    }
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("Passwords do not match")
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setForgotError(data?.message || "Password reset failed")
        return
      }

      setForgotMessage(data?.message || "Password reset successful. Please login.")
      setFormData((prev) => ({ ...prev, email: forgotData.email, password: "", loginAs: "volunteer" }))
      setTimeout(() => {
        closeForgot()
      }, 1200)
    } catch {
      setForgotError("Password reset failed")
    } finally {
      setForgotLoading(false)
    }
  }

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
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError("Invalid email or password")
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100))
        const session = await getSession()
        const user = session?.user as any
        
        if (!user) {
          setError("Failed to get user session. Please try again.")
          return
        }
        
        const userRole = user?.role ?? "user"
        const mustChangePassword = user?.mustChangePassword ?? false
        
        if (mustChangePassword) {
          router.push("/set-password")
        } else {
          // Check login preference
          if (formData.loginAs === "admin") {
            // User wants to login as Admin/Convener
            if (userRole === "admin" || userRole === "sub-admin") {
              router.push("/admin")
            } else {
              // Not an admin but tried to login as one
              await signOut({ redirect: false })
              setError("Access Denied: You are a registered Volunteer. Please switch to the 'Volunteer' tab to login.")
            }
          } else {
            // User wants to login as Volunteer
            if (userRole === "admin" || userRole === "sub-admin") {
              await signOut({ redirect: false })
              setError("Access Denied: You are an Administrator. Please switch to the 'Convener / Admin' tab to login.")
            } else {
              router.push("/dashboard")
            }
          }
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
          {/* <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl hover-lift"> */}
            {/* <Shield className="w-14 h-14 text-white" /> */}
            {/* logo 1+ logo 2 + logo3 */}
            <div className="flex space-x-8 justify-center mb-8 items-center">
              <img src="/1.png" alt="GBU Logo" className="w-22 h-22 rounded-full border-2 border-white" />
              <img src="/nssLogo.png" alt="NSS Logo" className="w-20 h-20 rounded-full border-2 border-white" />
              <img src="/myBharatLogo.png" alt="GBU Logo" className="w-35 h-25 rounded-full border-2 border-white" />
            </div>

       
          <h2 className="text-4xl font-bold text-foreground mb-2">NSS Digital Login</h2>
          <p className="text-lg text-muted-foreground mb-1">National Service Scheme - Gautam Buddha University</p>
          <p className="text-sm text-muted-foreground">राष्ट्रीय सेवा योजना - गौतम बुद्ध विश्वविद्यालय </p>
          {/* <p className="text-xs text-muted-foreground mt-2">For Admin, Sub-Admin & Volunteers</p> */}
        </div>

        <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8">
          {!forgotOpen ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-primary" />
                      Login As
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-4 p-1 bg-muted/50 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, loginAs: "volunteer" })}
                      className={`flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                        formData.loginAs === "volunteer"
                          ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Volunteer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, loginAs: "admin" })}
                      className={`flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                        formData.loginAs === "admin"
                          ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Convener / Admin
                    </button>
                  </div>
                </div>

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
                    placeholder="Enter your email"
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
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={openForgot}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
                    >
                      Forgot password?
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
                    Sign in
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
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-foreground">Volunteer Password Reset</h4>
                <button type="button" onClick={closeForgot} className="text-xs text-muted-foreground hover:text-foreground">
                  Back to Login
                </button>
              </div>

              <div className="text-xs text-muted-foreground">Step {forgotStep} of 3</div>

              {forgotStep === 1 && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={forgotData.name}
                    onChange={(e) => setForgotData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotData.email}
                    onChange={(e) => setForgotData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 text-sm font-semibold"
                  >
                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={forgotData.otp}
                    onChange={(e) => setForgotData((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, "") }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 text-sm font-semibold"
                  >
                    {forgotLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={forgotData.newPassword}
                    onChange={(e) => setForgotData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={forgotData.confirmPassword}
                    onChange={(e) => setForgotData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 text-sm font-semibold"
                  >
                    {forgotLoading ? "Updating..." : "Set New Password"}
                  </button>
                </div>
              )}

              {forgotError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-xs font-medium">
                  {forgotError}
                </div>
              )}
              {forgotMessage && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-xs font-medium">
                  {forgotMessage}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>National Service Scheme - Uttar Pradesh</p>
        </div>
      </div>
    </div>
  )
}
