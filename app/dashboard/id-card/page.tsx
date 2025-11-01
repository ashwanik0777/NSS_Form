"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Download, Eye, Loader2, AlertCircle, CheckCircle2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VolunteerIDCardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null)
  const [eligibility, setEligibility] = useState<{
    eligible: boolean
    reason?: string
  } | null>(null)

  useEffect(() => {
    if (status === "loading") return

    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }

    if (user.role !== "volunteer" && user.role !== "user") {
      router.replace("/")
      return
    }

    checkEligibility()
  }, [session, status, router])

  const checkEligibility = async () => {
    try {
      const res = await fetch("/api/volunteer/profile")
      const profileData = await res.json()

      if (!profileData.success) {
        setEligibility({ eligible: false, reason: "Failed to load profile data" })
        setLoading(false)
        return
      }

      // Check profile completion
      if (profileData.completion?.percent < 100) {
        setEligibility({
          eligible: false,
          reason: "Please complete your profile first (100% required)",
        })
        setLoading(false)
        return
      }

      // Check project selection
      const projectRes = await fetch("/api/volunteer/projects")
      const projectData = await projectRes.json()

      if (!projectData.success || !projectData.selectedProject) {
        setEligibility({
          eligible: false,
          reason: "Please select a project first",
        })
        setLoading(false)
        return
      }

      setEligibility({ eligible: true })
    } catch (error) {
      console.error("Error checking eligibility:", error)
      setEligibility({ eligible: false, reason: "Failed to check eligibility" })
    } finally {
      setLoading(false)
    }
  }

  const handleViewIDCard = async () => {
    setGenerating(true)
    setError(null)
    setIdCardUrl(null)

    try {
      const res = await fetch("/api/volunteer/id-card")
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to generate ID card")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setIdCardUrl(url)

      // Open in new tab
      window.open(url, "_blank")
    } catch (err: any) {
      setError(err.message || "Failed to generate ID card")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadIDCard = async () => {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/volunteer/id-card")
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to generate ID card")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement("a")
      link.href = url
      link.download = `NSS_ID_Card_${(session?.user as any)?.name?.replace(/\s+/g, "_") || "Volunteer"}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err: any) {
      setError(err.message || "Failed to download ID card")
    } finally {
      setGenerating(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            NSS Identity Card
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and download your official NSS Volunteer Identity Card
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {eligibility && !eligibility.eligible && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>ID Card Not Available:</strong> {eligibility.reason}
            {eligibility.reason?.includes("profile") && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={() => router.push("/dashboard/profile")}
              >
                Complete Profile →
              </Button>
            )}
            {eligibility.reason?.includes("project") && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={() => router.push("/dashboard/projects")}
              >
                Select Project →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ID Card Generation</CardTitle>
          <CardDescription>
            Your ID card will be generated with all your verified information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {eligibility?.eligible ? (
            <>
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">You're eligible!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your profile is complete and you have selected a project. You can now generate your NSS Identity Card.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleViewIDCard}
                  disabled={generating}
                  className="w-full h-12"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      View ID Card
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownloadIDCard}
                  disabled={generating}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download ID Card
                    </>
                  )}
                </Button>
              </div>

              {idCardUrl && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    ID Card opened in a new tab. If it didn't open,{" "}
                    <a
                      href={idCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      click here
                    </a>
                    .
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Important Information
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your ID card includes your photo, signature, and verified information</li>
                  <li>Keep your ID card safe and carry it during NSS activities</li>
                  <li>Report loss or damage immediately to your coordinator</li>
                  <li>The ID card is valid only for the current academic year</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Please complete all requirements to generate your ID card.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

