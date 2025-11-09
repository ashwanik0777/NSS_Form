"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, FileText, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Application {
  _id: string
  formNo: string
  institutionName: string
  nameEnglish: string
  status: string
  [key: string]: any
}

export default function ApplicationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchApplication()
  }, [session, status, router])

  const fetchApplication = async () => {
    try {
      const res = await fetch("/api/volunteer/application")
      const data = await res.json()
      if (data.success && data.application) {
        setApplication(data.application)
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Application Found</h3>
        <p className="text-muted-foreground mb-4">You haven't submitted an application yet.</p>
        <Link
          href="/register"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Apply Now
        </Link>
      </div>
    )
  }

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <FileText className="w-6 h-6 mr-3 text-primary" />
            My Application
          </h1>
          {application.status === "approved" && (
            <a
              href={`/api/generate-pdf?id=${application._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </a>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Application Number</p>
              <p className="text-lg font-semibold text-foreground">{application.formNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-foreground capitalize">{application.status.replace("-", " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Institution</p>
              <p className="text-lg font-semibold text-foreground">{application.institutionName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold text-foreground">{application.nameEnglish}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

