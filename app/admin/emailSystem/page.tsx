"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import {
  Mail,
  Send,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Eye,
  Trash2,
  Plus,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Filter,
  Check,
  ChevronRight,
  Server,
  Zap,
} from "lucide-react"

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  content: string
  type: "approval" | "rejection" | "reminder" | "custom"
  createdAt: string
  updatedAt: string
}

interface EmailLog {
  _id: string
  to: string
  recipientName?: string
  unitNo?: string
  type?: "single" | "bulk" | "system"
  subject: string
  content: string
  status: "sent" | "failed" | "pending"
  sentAt: string
  templateId?: string
  error?: string
}

interface RecipientItem {
  id: string
  name: string
  email: string
  unitNo: string
  formNo: string
  status: string
}

interface RecipientDeliveryState extends RecipientItem {
  deliveryStatus: "pending" | "sending" | "sent" | "failed"
  error?: string
  sentAt?: string
}

interface EmailStats {
  totalSent: number
  totalFailed: number
  totalLogs: number
  sentToday: number
  dailyLimit: number
  remainingToday: number
}

export default function EmailSystemPage() {
  const [activeTab, setActiveTab] = useState("compose")
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    totalLogs: 0,
    sentToday: 0,
    dailyLimit: 500,
    remainingToday: 500,
  })

  // Compose State
  const [composeData, setComposeData] = useState({
    recipients: "",
    subject: "",
    content: "",
    templateId: "",
  })
  const [composePreview, setComposePreview] = useState(false)

  // Template State
  const [templateData, setTemplateData] = useState({
    name: "",
    subject: "",
    content: "",
    type: "custom" as const,
  })
  const [seedingTemplates, setSeedingTemplates] = useState(false)

  // Bulk Email State
  const [bulkFilter, setBulkFilter] = useState({
    recipientType: "approved",
    unit: "all",
    customRecipients: "",
  })
  const [bulkSubject, setBulkSubject] = useState("")
  const [bulkContent, setBulkContent] = useState("")
  const [bulkTemplateId, setBulkTemplateId] = useState("")
  const [bulkThrottleMs, setBulkThrottleMs] = useState(150)
  const [previewBulkEmail, setPreviewBulkEmail] = useState(false)

  // Recipient Preview & Selective Target State
  const [recipientsList, setRecipientsList] = useState<RecipientItem[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set())
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false)
  const [recipientSearchTerm, setRecipientSearchTerm] = useState("")

  // Live Bulk Sending Tracker State
  const [isBulkTrackerOpen, setIsBulkTrackerOpen] = useState(false)
  const [isSendingLive, setIsSendingLive] = useState(false)
  const [isPausedLive, setIsPausedLive] = useState(false)
  const [trackerDeliveryList, setTrackerDeliveryList] = useState<RecipientDeliveryState[]>([])
  const [activeRecipient, setActiveRecipient] = useState<RecipientItem | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Mutable refs to control pause/cancel in async execution
  const isCancelledRef = useRef(false)
  const isPausedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Log filter & details modal
  const [logSearchTerm, setLogSearchTerm] = useState("")
  const [logStatusFilter, setLogStatusFilter] = useState("all")
  const [selectedLogDetail, setSelectedLogDetail] = useState<EmailLog | null>(null)

  // Test Email in Settings
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [testingSmtp, setTestingSmtp] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchTemplates()
    fetchEmailLogs()
  }, [])

  // Auto-fetch recipient preview when audience filter changes
  useEffect(() => {
    if (bulkFilter.recipientType !== "custom") {
      fetchRecipients()
    }
  }, [bulkFilter.recipientType, bulkFilter.unit])

  // Timer for sending duration
  useEffect(() => {
    if (isSendingLive && !isPausedLive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isSendingLive, isPausedLive])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const fetchEmailLogs = async () => {
    try {
      const response = await fetch("/api/admin/email-logs")
      if (response.ok) {
        const data = await response.json()
        setEmailLogs(data.logs || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching email logs:", error)
    }
  }

  const fetchRecipients = async () => {
    setLoadingRecipients(true)
    try {
      const params = new URLSearchParams({
        status: bulkFilter.recipientType,
        unit: bulkFilter.unit,
      })
      const response = await fetch(`/api/admin/email-recipients?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const list: RecipientItem[] = data.recipients || []
        setRecipientsList(list)
        // Default select all matching recipients
        setSelectedRecipientIds(new Set(list.map((r) => r.id)))
      }
    } catch (error) {
      console.error("Error fetching recipients:", error)
    } finally {
      setLoadingRecipients(false)
    }
  }

  const seedPresetTemplates = async () => {
    setSeedingTemplates(true)
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_presets" }),
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
        toast({
          title: "Templates Loaded",
          description: data.message || "Preset templates added successfully!",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to seed preset templates",
        variant: "destructive",
      })
    } finally {
      setSeedingTemplates(false)
    }
  }

  // Template usage helpers
  const applyTemplateToCompose = (template: EmailTemplate) => {
    setComposeData((prev) => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      templateId: template._id,
    }))
    toast({
      title: "Template Applied",
      description: `Loaded "${template.name}" into Compose`,
    })
  }

  const applyTemplateToBulk = (template: EmailTemplate) => {
    setBulkSubject(template.subject)
    setBulkContent(template.content)
    setBulkTemplateId(template._id)
    toast({
      title: "Template Applied",
      description: `Loaded "${template.name}" into Bulk Email`,
    })
  }

  // Variable chip inserter
  const insertVariable = (variable: string, target: "compose" | "bulk") => {
    if (target === "compose") {
      setComposeData((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content} ${variable}` : variable,
      }))
    } else {
      setBulkContent((prev) => (prev ? `${prev} ${variable}` : variable))
    }
    toast({
      title: "Variable Added",
      description: `Inserted ${variable}`,
    })
  }

  // Send Single Email
  const sendSingleEmail = async () => {
    if (!composeData.recipients || !composeData.subject || !composeData.content) {
      toast({
        title: "Missing Fields",
        description: "Please specify recipients, subject, and content.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "single",
          recipients: composeData.recipients.split(",").map((email) => email.trim()),
          subject: composeData.subject,
          content: composeData.content,
          templateId: composeData.templateId || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast({
          title: "Email Sent Successfully",
          description: data.message || "Your email has been dispatched.",
        })
        setComposeData({ recipients: "", subject: "", content: "", templateId: "" })
        fetchEmailLogs()
      } else {
        throw new Error(data.message || "Failed to send email")
      }
    } catch (error: any) {
      toast({
        title: "Error Sending Email",
        description: error.message || "Check your SMTP settings or network connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // LIVE BULK EMAIL SENDING ENGINE (Client Batching)
  // ==========================================
  const startBulkEmailDispatch = () => {
    if (!bulkSubject.trim() || !bulkContent.trim()) {
      toast({
        title: "Subject & Content Required",
        description: "Please provide both an email subject and body content.",
        variant: "destructive",
      })
      return
    }

    // Determine target recipients
    let targets: RecipientItem[] = []
    if (bulkFilter.recipientType === "custom") {
      const customEmails = bulkFilter.customRecipients
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes("@"))

      if (customEmails.length === 0) {
        toast({
          title: "No Valid Emails",
          description: "Please enter at least one valid recipient email in the custom list.",
          variant: "destructive",
        })
        return
      }

      targets = customEmails.map((email, idx) => ({
        id: `custom-${idx}`,
        email,
        name: email.split("@")[0],
        unitNo: "Custom",
        formNo: "-",
        status: "custom",
      }))
    } else {
      targets = recipientsList.filter((r) => selectedRecipientIds.has(r.id))
      if (targets.length === 0) {
        toast({
          title: "No Recipients Selected",
          description: "Please select at least one recipient to send to.",
          variant: "destructive",
        })
        return
      }
    }

    // Check against remaining Gmail daily quota
    if (targets.length > stats.remainingToday && stats.remainingToday < 500) {
      const proceed = confirm(
        `Warning: You have selected ${targets.length} recipients, but only ~${stats.remainingToday} emails remain in your standard Gmail daily limit (500/day). Continue anyway?`
      )
      if (!proceed) return
    }

    // Initialize delivery list
    const initialList: RecipientDeliveryState[] = targets.map((r) => ({
      ...r,
      deliveryStatus: "pending",
    }))

    setTrackerDeliveryList(initialList)
    setIsBulkTrackerOpen(true)
    setIsSendingLive(true)
    setIsPausedLive(false)
    setElapsedSeconds(0)
    isCancelledRef.current = false
    isPausedRef.current = false

    // Launch worker loop
    runLiveBatchWorker(initialList)
  }

  const runLiveBatchWorker = async (listToProcess: RecipientDeliveryState[]) => {
    for (let i = 0; i < listToProcess.length; i++) {
      // Check cancellation
      if (isCancelledRef.current) {
        break
      }

      // Check pause
      while (isPausedRef.current && !isCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      if (isCancelledRef.current) break

      const currentItem = listToProcess[i]

      // Skip already successfully sent
      if (currentItem.deliveryStatus === "sent") continue

      // Update UI: currently sending
      setActiveRecipient(currentItem)
      setTrackerDeliveryList((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, deliveryStatus: "sending" } : item))
      )

      try {
        const response = await fetch("/api/admin/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "batch",
            items: [
              {
                email: currentItem.email,
                name: currentItem.name,
                unitNo: currentItem.unitNo,
                formNo: currentItem.formNo,
              },
            ],
            subject: bulkSubject,
            content: bulkContent,
            templateId: bulkTemplateId || undefined,
          }),
        })

        const data = await response.json()
        const result = data.results?.[0]

        if (response.ok && result?.status === "sent") {
          setTrackerDeliveryList((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    deliveryStatus: "sent",
                    sentAt: new Date().toLocaleTimeString(),
                  }
                : item
            )
          )
        } else {
          const errorMsg = result?.error || data.message || "Sending failed"
          setTrackerDeliveryList((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    deliveryStatus: "failed",
                    error: errorMsg,
                  }
                : item
            )
          )
        }
      } catch (err: any) {
        setTrackerDeliveryList((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  deliveryStatus: "failed",
                  error: err.message || "Network error",
                }
              : item
          )
        )
      }

      // Throttle delay to respect Gmail anti-spam burst rules
      if (bulkThrottleMs > 0 && i < listToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, bulkThrottleMs))
      }
    }

    setIsSendingLive(false)
    setActiveRecipient(null)
    fetchEmailLogs() // Refresh audit logs & stats
  }

  const togglePause = () => {
    if (isPausedLive) {
      isPausedRef.current = false
      setIsPausedLive(false)
    } else {
      isPausedRef.current = true
      setIsPausedLive(true)
    }
  }

  const cancelSending = () => {
    if (confirm("Are you sure you want to stop the remaining emails in this queue?")) {
      isCancelledRef.current = true
      setIsSendingLive(false)
      setActiveRecipient(null)
    }
  }

  const retryFailedEmails = () => {
    const failedOnes = trackerDeliveryList.filter((r) => r.deliveryStatus === "failed")
    if (failedOnes.length === 0) return

    isCancelledRef.current = false
    isPausedRef.current = false
    setIsSendingLive(true)
    setIsPausedLive(false)

    // Reset failed ones to pending
    const resetList = trackerDeliveryList.map((item) =>
      item.deliveryStatus === "failed" ? { ...item, deliveryStatus: "pending" as const, error: undefined } : item
    )
    setTrackerDeliveryList(resetList)
    runLiveBatchWorker(resetList)
  }

  const exportDeliveryReport = () => {
    const headers = ["Recipient Name", "Email Address", "Unit", "Delivery Status", "Time", "Error Details"]
    const rows = trackerDeliveryList.map((r) => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.unitNo}"`,
      `"${r.deliveryStatus}"`,
      `"${r.sentAt || ""}"`,
      `"${r.error || ""}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `nss_email_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Live computed metrics for tracker
  const liveSentCount = trackerDeliveryList.filter((r) => r.deliveryStatus === "sent").length
  const liveFailedCount = trackerDeliveryList.filter((r) => r.deliveryStatus === "failed").length
  const liveTotalCount = trackerDeliveryList.length
  const liveProgressPct = liveTotalCount > 0 ? Math.round(((liveSentCount + liveFailedCount) / liveTotalCount) * 100) : 0
  const liveRemainingCount = Math.max(0, liveTotalCount - (liveSentCount + liveFailedCount))

  // Template CRUD
  const saveTemplate = async () => {
    if (!templateData.name || !templateData.subject || !templateData.content) {
      toast({
        title: "Missing Fields",
        description: "Please fill in template name, subject, and content.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      })

      if (response.ok) {
        toast({
          title: "Template Saved",
          description: `Saved "${templateData.name}" successfully`,
        })
        setTemplateData({ name: "", subject: "", content: "", type: "custom" })
        fetchTemplates()
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Template Deleted",
          description: "Template removed successfully",
        })
        fetchTemplates()
      } else {
        throw new Error("Failed to delete template")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return emailLogs.filter((log) => {
      const matchesSearch =
        log.to.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
        log.subject.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
        (log.recipientName && log.recipientName.toLowerCase().includes(logSearchTerm.toLowerCase()))
      const matchesStatus = logStatusFilter === "all" || log.status === logStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [emailLogs, logSearchTerm, logStatusFilter])

  // Test Email
  const sendTestEmail = async () => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid recipient address for the test email.",
        variant: "destructive",
      })
      return
    }

    setTestingSmtp(true)
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "single",
          recipients: [testEmailAddress.trim()],
          subject: "NSS Portal SMTP Verification Test",
          content: `This is a verification test email from the NSS Email System (Gautam Buddha University).\n\nIf you are reading this, your SMTP transport and Gmail connection are working smoothly!`,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({
          title: "Test Email Delivered! ✅",
          description: `Successfully sent test email to ${testEmailAddress}.`,
        })
        fetchEmailLogs()
      } else {
        throw new Error(data.message || "SMTP failed")
      }
    } catch (err: any) {
      toast({
        title: "Test Email Failed ❌",
        description: err.message || "Failed to connect to SMTP server.",
        variant: "destructive",
      })
    } finally {
      setTestingSmtp(false)
    }
  }

  // Format sample preview text
  const renderSamplePreview = (content: string, subject: string) => {
    const sample = {
      name: "Ramesh Sharma",
      unitNo: "Unit 1",
      email: "ramesh.sharma@example.com",
      formNo: "1902",
    }
    const finalSubject = subject
      .replace(/\{\{\s*name\s*\}\}/gi, sample.name)
      .replace(/\{\{\s*unitNo\s*\}\}/gi, sample.unitNo)
      .replace(/\{\{\s*email\s*\}\}/gi, sample.email)
      .replace(/\{\{\s*formNo\s*\}\}/gi, sample.formNo)

    const finalContent = content
      .replace(/\{\{\s*name\s*\}\}/gi, sample.name)
      .replace(/\{\{\s*unitNo\s*\}\}/gi, sample.unitNo)
      .replace(/\{\{\s*email\s*\}\}/gi, sample.email)
      .replace(/\{\{\s*formNo\s*\}\}/gi, sample.formNo)

    return (
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white text-slate-800">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-blue-200 font-semibold mb-1">
            National Service Scheme
          </p>
          <h3 className="text-lg font-bold">Gautam Buddha University</h3>
          <p className="text-xs text-blue-100 mt-1">Official Volunteer Communication</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="pb-3 border-b">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Subject</span>
            <p className="font-semibold text-base text-slate-900 mt-0.5">{finalSubject || "(No subject set)"}</p>
          </div>
          <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap min-h-[120px]">
            {finalContent || "(No email content entered yet...)"}
          </div>
        </div>
        <div className="bg-slate-50 border-t p-4 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-600">National Service Scheme (NSS), Gautam Buddha University</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            This is an automated communication sent to registered volunteers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="email.view">
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Email Command Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Send, track, and automate student communications with live delivery telemetry
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <Card className="p-3 py-2 border shadow-none bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-[11px] font-medium text-slate-600">Total Sent</p>
                  <p className="text-lg font-bold text-blue-700">{stats.totalSent}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 py-2 border shadow-none bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-medium text-slate-600">Today's Quota</p>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 rounded">
                      {stats.sentToday}/500
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{stats.remainingToday} left today</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 py-2 border shadow-none bg-purple-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-[11px] font-medium text-slate-600">Templates</p>
                  <p className="text-lg font-bold text-purple-700">{templates.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Daily Quota / SMTP Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/60 rounded-xl p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-md shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">Sender: gbunssofficial@gmail.com</span>
                <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-300">
                  Gmail SMTP
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                  Daily Quota: 500 emails/day
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Bulk sending throttles automatically (150ms/email) to prevent provider spam filtering. Live tracking
                keeps you updated per recipient.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs shrink-0 bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
            onClick={() => setActiveTab("settings")}
          >
            <Info className="w-3.5 h-3.5 mr-1.5" />
            View Sending Limits
          </Button>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger value="compose" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Send className="w-4 h-4 mr-1.5" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-1.5" />
              Bulk Email
              {recipientsList.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                  {recipientsList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-1.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4 mr-1.5" />
              Email Logs
              {emailLogs.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] font-semibold rounded-full">
                  {emailLogs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm col-span-2 md:col-span-1">
              <Server className="w-4 h-4 mr-1.5" />
              SMTP & Limits
            </TabsTrigger>
          </TabsList>

          {/* ======================================================== */}
          {/* TAB 1: COMPOSE SINGLE / DIRECT EMAIL */}
          {/* ======================================================== */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        Compose Email
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setComposePreview(!composePreview)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          {composePreview ? "Hide Preview" : "Live Preview"}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Send direct or targeted emails to specific recipients or coordinators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="compose-recipients">Recipients (comma-separated)</Label>
                        <Input
                          id="compose-recipients"
                          placeholder="e.g. volunteer1@gmail.com, volunteer2@gmail.com"
                          value={composeData.recipients}
                          onChange={(e) => setComposeData((prev) => ({ ...prev, recipients: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compose-template">Apply Preset Template</Label>
                        <Select
                          value={composeData.templateId}
                          onValueChange={(val) => {
                            const selected = templates.find((t) => t._id === val)
                            if (selected) applyTemplateToCompose(selected)
                          }}
                        >
                          <SelectTrigger id="compose-template">
                            <SelectValue placeholder="Choose a saved template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((tpl) => (
                              <SelectItem key={tpl._id} value={tpl._id}>
                                {tpl.name}
                              </SelectItem>
                            ))}
                            {templates.length === 0 && (
                              <SelectItem value="none" disabled>
                                No templates found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="compose-subject">Subject</Label>
                      <Input
                        id="compose-subject"
                        placeholder="Subject line..."
                        value={composeData.subject}
                        onChange={(e) => setComposeData((prev) => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    {/* Variable shortcut chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compose-content">Message Content</Label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 font-medium">Insert tag:</span>
                          {["{{name}}", "{{unitNo}}", "{{email}}"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertVariable(tag, "compose")}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-mono transition-colors"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        id="compose-content"
                        placeholder="Write your email here... Paragraphs and line breaks are automatically formatted into a professional NSS template."
                        rows={10}
                        value={composeData.content}
                        onChange={(e) => setComposeData((prev) => ({ ...prev, content: e.target.value }))}
                        className="font-sans leading-relaxed text-sm"
                      />
                    </div>

                    <Button
                      onClick={sendSingleEmail}
                      disabled={loading || !composeData.recipients || !composeData.subject}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending Email...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side: Live Email Template Preview */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      Live Email Preview
                    </CardTitle>
                    <CardDescription>
                      This is how recipients see the email in their Gmail / Outlook client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderSamplePreview(composeData.content, composeData.subject)}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 2: BULK EMAIL WITH LIVE TELEMETRY TRACKER */}
          {/* ======================================================== */}
          <TabsContent value="bulk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Audience and Filtering */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Target Audience Selection */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        1. Target Audience
                      </CardTitle>
                      {bulkFilter.recipientType !== "custom" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => setIsRecipientModalOpen(true)}
                        >
                          <Filter className="w-3.5 h-3.5 mr-1" />
                          Inspect & Select Recipients ({selectedRecipientIds.size}/{recipientsList.length})
                        </Button>
                      )}
                    </div>
                    <CardDescription>
                      Select the volunteer cohort or specify a custom mailing list.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulk-audience">Volunteer Group</Label>
                        <Select
                          value={bulkFilter.recipientType}
                          onValueChange={(val) => setBulkFilter((prev) => ({ ...prev, recipientType: val }))}
                        >
                          <SelectTrigger id="bulk-audience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved Volunteers</SelectItem>
                            <SelectItem value="pending">Pending Applications</SelectItem>
                            <SelectItem value="all">All Active Volunteers</SelectItem>
                            <SelectItem value="rejected">Rejected Applicants</SelectItem>
                            <SelectItem value="custom">Custom Email List</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {bulkFilter.recipientType !== "custom" && (
                        <div className="space-y-2">
                          <Label htmlFor="bulk-unit">Unit Filter</Label>
                          <Select
                            value={bulkFilter.unit}
                            onValueChange={(val) => setBulkFilter((prev) => ({ ...prev, unit: val }))}
                          >
                            <SelectTrigger id="bulk-unit">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Units (1 - 6)</SelectItem>
                              <SelectItem value="1">Unit 1</SelectItem>
                              <SelectItem value="2">Unit 2</SelectItem>
                              <SelectItem value="3">Unit 3</SelectItem>
                              <SelectItem value="4">Unit 4</SelectItem>
                              <SelectItem value="5">Unit 5</SelectItem>
                              <SelectItem value="6">Unit 6</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {bulkFilter.recipientType === "custom" ? (
                      <div className="space-y-2">
                        <Label htmlFor="custom-emails">Custom Email List (comma or newline separated)</Label>
                        <Textarea
                          id="custom-emails"
                          placeholder="student1@gmail.com, student2@gmail.com..."
                          rows={4}
                          value={bulkFilter.customRecipients}
                          onChange={(e) => setBulkFilter((prev) => ({ ...prev, customRecipients: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {loadingRecipients ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {loadingRecipients
                                ? "Counting matching volunteers..."
                                : `Found ${recipientsList.length} volunteers (${selectedRecipientIds.size} selected)`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Filtered by {bulkFilter.recipientType} • {bulkFilter.unit === "all" ? "All Units" : `Unit ${bulkFilter.unit}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-700 hover:text-blue-800"
                          onClick={fetchRecipients}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          Refresh List
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Message Composer */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        2. Email Message
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewBulkEmail(!previewBulkEmail)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        {previewBulkEmail ? "Edit Mode" : "Preview Branded Email"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulk-template-select">Choose Saved Template (Optional)</Label>
                      <Select
                        value={bulkTemplateId}
                        onValueChange={(val) => {
                          const tpl = templates.find((t) => t._id === val)
                          if (tpl) applyTemplateToBulk(tpl)
                        }}
                      >
                        <SelectTrigger id="bulk-template-select">
                          <SelectValue placeholder="Select a template or compose freely..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((tpl) => (
                            <SelectItem key={tpl._id} value={tpl._id}>
                              {tpl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bulk-subject">Subject Line</Label>
                      <Input
                        id="bulk-subject"
                        placeholder="e.g. Mandatory Briefing Meeting for Unit {{unitNo}}"
                        value={bulkSubject}
                        onChange={(e) => setBulkSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bulk-content">Email Body</Label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 font-medium">Personalize with:</span>
                          {["{{name}}", "{{unitNo}}", "{{email}}", "{{formNo}}"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertVariable(tag, "bulk")}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-mono transition-colors"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        id="bulk-content"
                        placeholder="Dear {{name}},\n\nWrite your announcement or notice here. When sent in bulk, tags like {{name}} and {{unitNo}} are replaced dynamically with each student's real information."
                        rows={9}
                        value={bulkContent}
                        onChange={(e) => setBulkContent(e.target.value)}
                        className="font-sans leading-relaxed text-sm"
                      />
                    </div>

                    {/* Throttle & Safety Settings */}
                    <div className="p-3 bg-slate-50 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700 block">Delivery Speed / Throttling</span>
                        <span className="text-slate-500">
                          Pause between each dispatch to comply with Gmail SMTP limits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(bulkThrottleMs)}
                          onValueChange={(val) => setBulkThrottleMs(Number(val))}
                        >
                          <SelectTrigger className="h-8 w-32 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">100ms (Fast)</SelectItem>
                            <SelectItem value="150">150ms (Optimal)</SelectItem>
                            <SelectItem value="250">250ms (Safe)</SelectItem>
                            <SelectItem value="500">500ms (Gentle)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Launch Bulk Action */}
                    <Button
                      onClick={startBulkEmailDispatch}
                      disabled={isSendingLive || !bulkSubject || !bulkContent}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base shadow-sm"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Launch Live Bulk Email (
                      {bulkFilter.recipientType === "custom"
                        ? bulkFilter.customRecipients.split(/[,\n]/).filter((e) => e.includes("@")).length
                        : selectedRecipientIds.size}{" "}
                      Recipients)
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Live Branded Preview */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border shadow-sm sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        Live Message Preview
                      </div>
                      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                        Personalized Sample
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Previewing with placeholder data: Ramesh Sharma (Unit 1, Form #1902)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderSamplePreview(bulkContent, bulkSubject)}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 3: EMAIL TEMPLATES */}
          {/* ======================================================== */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Create Template Form */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-600" />
                      Create New Template
                    </CardTitle>
                    <CardDescription>
                      Create reusable email templates with customizable variables.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tpl-name">Template Name</Label>
                      <Input
                        id="tpl-name"
                        placeholder="e.g. Orientation Meeting Notice"
                        value={templateData.name}
                        onChange={(e) => setTemplateData((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tpl-type">Category</Label>
                      <Select
                        value={templateData.type}
                        onValueChange={(val: any) => setTemplateData((prev) => ({ ...prev, type: val }))}
                      >
                        <SelectTrigger id="tpl-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">General / Custom</SelectItem>
                          <SelectItem value="reminder">Meeting / Event Reminder</SelectItem>
                          <SelectItem value="approval">Application Approval</SelectItem>
                          <SelectItem value="rejection">Application Rejection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tpl-subject">Default Subject</Label>
                      <Input
                        id="tpl-subject"
                        placeholder="e.g. Important Update for NSS Volunteers ({{name}})"
                        value={templateData.subject}
                        onChange={(e) => setTemplateData((prev) => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tpl-content">Default Body</Label>
                        <span className="text-[11px] text-slate-400">Supports variables</span>
                      </div>
                      <Textarea
                        id="tpl-content"
                        placeholder="Write standard template text here..."
                        rows={8}
                        value={templateData.content}
                        onChange={(e) => setTemplateData((prev) => ({ ...prev, content: e.target.value }))}
                        className="text-sm font-sans leading-relaxed"
                      />
                    </div>

                    <Button
                      onClick={saveTemplate}
                      disabled={loading || !templateData.name || !templateData.subject || !templateData.content}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Save Template
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Saved Templates List */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg">Saved Templates ({templates.length})</CardTitle>
                      <CardDescription>Quickly apply or edit standard email messages</CardDescription>
                    </div>
                    {templates.length === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={seedPresetTemplates}
                        disabled={seedingTemplates}
                        className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {seedingTemplates ? "Loading Presets..." : "Load 4 NSS Presets"}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {templates.map((tpl) => (
                      <div
                        key={tpl._id}
                        className="border rounded-xl p-4 bg-white hover:border-blue-200 transition-all space-y-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900">{tpl.name}</h4>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {tpl.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{tpl.subject}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                applyTemplateToCompose(tpl)
                                setActiveTab("compose")
                              }}
                            >
                              Compose
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 text-indigo-700 hover:bg-indigo-50"
                              onClick={() => {
                                applyTemplateToBulk(tpl)
                                setActiveTab("bulk")
                              }}
                            >
                              Bulk
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteTemplate(tpl._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded">
                          {tpl.content}
                        </p>
                      </div>
                    ))}

                    {templates.length === 0 && (
                      <div className="text-center py-12 border border-dashed rounded-xl space-y-3">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-semibold text-slate-700">No email templates created yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Create your first template above, or click below to load official NSS announcement presets.
                        </p>
                        <Button
                          size="sm"
                          onClick={seedPresetTemplates}
                          disabled={seedingTemplates}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Load NSS Presets
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 4: EMAIL AUDIT LOGS & TRACKING HISTORY */}
          {/* ======================================================== */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Email Delivery Telemetry & Audit Logs
                    </CardTitle>
                    <CardDescription>
                      Full delivery trail of all individual and bulk dispatches with status codes.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={fetchEmailLogs}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by recipient email, volunteer name, or subject..."
                      value={logSearchTerm}
                      onChange={(e) => setLogSearchTerm(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                  <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Delivery Statuses</SelectItem>
                      <SelectItem value="sent">Sent Successfully</SelectItem>
                      <SelectItem value="failed">Delivery Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logs List Table */}
                <div className="border rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="divide-y max-h-[550px] overflow-y-auto">
                    {filteredLogs.map((log) => (
                      <div
                        key={log._id}
                        className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full shrink-0 mt-0.5 ${
                              log.status === "sent"
                                ? "bg-emerald-100 text-emerald-700"
                                : log.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {log.status === "sent" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : log.status === "failed" ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-slate-900">{log.subject}</p>
                              {log.unitNo && log.unitNo !== "N/A" && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Unit {log.unitNo}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 capitalize ${
                                  log.status === "sent"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : log.status === "failed"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {log.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              To: <span className="font-medium text-slate-700">{log.to}</span>
                              {log.recipientName && (
                                <span className="text-slate-400"> ({log.recipientName})</span>
                              )}
                            </p>
                            {log.error && (
                              <p className="text-xs text-red-600 font-mono mt-1 bg-red-50 p-1 rounded inline-block">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(log.sentAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setSelectedLogDetail(log)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredLogs.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium text-sm">No email logs found matching criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 5: SMTP CONFIGURATION & SENDING LIMITS */}
          {/* ======================================================== */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sending Quotas & Telemetry */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Email Sending Limits & Account Quotas
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of current SMTP configurations and sending thresholds.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Live Quota Progress Bar */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">Today's Dispatch Quota</span>
                        <span className="text-blue-700">
                          {stats.sentToday} / {stats.dailyLimit} emails sent ({Math.round((stats.sentToday / stats.dailyLimit) * 100)}%)
                        </span>
                      </div>
                      <Progress
                        value={(stats.sentToday / stats.dailyLimit) * 100}
                        className="h-2.5 bg-blue-100"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Safe headroom: {stats.remainingToday} emails available today</span>
                        <span>Resets every 24 hours rolling</span>
                      </div>
                    </div>

                    {/* Detailed Limits Explanation */}
                    <div className="space-y-3 text-xs text-slate-700">
                      <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600" />
                        Active Provider Limit Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border">
                          <p className="font-semibold text-slate-900">1. Standard Gmail Account</p>
                          <p className="text-slate-500 mt-1">
                            Current address: <code className="text-blue-700">gbunssofficial@gmail.com</code>.
                            Free Gmail accounts have an official SMTP limit of <b>500 emails per 24 hours</b>.
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border">
                          <p className="font-semibold text-slate-900">2. Google Workspace (Upgrade)</p>
                          <p className="text-slate-500 mt-1">
                            If upgraded to a Google Workspace domain (e.g. <code>info@gbu.ac.in</code>), the daily SMTP limit expands to <b>2,000 emails per day</b>.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Rate Limiting & Burst Protection
                        </p>
                        <p className="text-xs text-amber-800">
                          Sending hundreds of emails instantly without delays can trigger Gmail error <code>421 Rate Limit Exceeded</code>. Our Bulk Email engine features automatic built-in throttling (150ms per dispatch) to ensure 100% inbox delivery without rate bans.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Email Verification */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Send Verification Test Email
                    </CardTitle>
                    <CardDescription>
                      Send a one-click test email to verify that SMTP connection and Gmail authentication are active.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter your personal email (e.g. admin@gmail.com)..."
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        onClick={sendTestEmail}
                        disabled={testingSmtp || !testEmailAddress}
                        className="bg-slate-800 hover:bg-slate-900 text-white shrink-0 text-xs"
                      >
                        {testingSmtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Send Test
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Connection Credentials Status */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-600" />
                      Active Transport Configuration
                    </CardTitle>
                    <CardDescription>Configured via system environment variables.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500">SMTP Host</Label>
                      <Input value="smtp.gmail.com" disabled className="bg-slate-50 font-mono text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Port</Label>
                        <Input value="587 (TLS/STARTTLS)" disabled className="bg-slate-50 font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Security</Label>
                        <Input value="STARTTLS" disabled className="bg-slate-50 font-mono text-xs" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Authenticated Sender Email</Label>
                      <Input value="gbunssofficial@gmail.com" disabled className="bg-slate-50 font-mono text-xs" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Authentication Protocol</Label>
                      <Input value="Google App Password (16-char token)" disabled className="bg-slate-50 text-xs" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ======================================================== */}
        {/* MODAL 1: LIVE BULK SENDING TELEMETRY TRACKER */}
        {/* ======================================================== */}
        <Dialog open={isBulkTrackerOpen} onOpenChange={(open) => !isSendingLive && setIsBulkTrackerOpen(open)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border shadow-2xl">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isSendingLive
                        ? "bg-emerald-400 animate-ping"
                        : isPausedLive
                        ? "bg-amber-400"
                        : "bg-blue-400"
                    }`}
                  />
                  <h3 className="font-bold text-lg text-white">
                    {isSendingLive
                      ? "Live Bulk Dispatch Telemetry"
                      : isPausedLive
                      ? "Dispatch Paused"
                      : "Bulk Email Completed"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-200 font-mono">
                    Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                  </span>
                </div>
              </div>

              {/* Subject pill */}
              <p className="text-xs text-blue-200 mt-2 truncate font-medium">
                Subject: <span className="text-white">{bulkSubject}</span>
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border">
                  <p className="text-[11px] text-slate-500 font-semibold">Total Queue</p>
                  <p className="text-xl font-bold text-slate-800">{liveTotalCount}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <p className="text-[11px] text-emerald-700 font-semibold">Sent Successfully</p>
                  <p className="text-xl font-bold text-emerald-700">{liveSentCount}</p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-200/60">
                  <p className="text-[11px] text-red-700 font-semibold">Failed</p>
                  <p className="text-xl font-bold text-red-700">{liveFailedCount}</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200/60">
                  <p className="text-[11px] text-blue-700 font-semibold">Remaining</p>
                  <p className="text-xl font-bold text-blue-700">{liveRemainingCount}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Overall Progress</span>
                  <span>{liveProgressPct}%</span>
                </div>
                <Progress value={liveProgressPct} className="h-2.5 bg-slate-100" />
              </div>

              {/* Current Active Recipient Spotlight */}
              {activeRecipient && isSendingLive && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-900">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                  <span className="font-semibold shrink-0">Currently dispatching to:</span>
                  <span className="font-medium truncate">{activeRecipient.name} ({activeRecipient.email})</span>
                </div>
              )}

              {/* Live Activity Stream */}
              <div className="border rounded-xl overflow-hidden bg-white">
                <div className="p-2.5 bg-slate-50 border-b text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Recipient Delivery Stream</span>
                  <span>{trackerDeliveryList.length} items</span>
                </div>
                <ScrollArea className="h-56">
                  <div className="divide-y text-xs">
                    {trackerDeliveryList.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 px-3 flex items-center justify-between gap-2 transition-colors ${
                          item.deliveryStatus === "sending"
                            ? "bg-blue-50/60"
                            : item.deliveryStatus === "sent"
                            ? "hover:bg-slate-50"
                            : item.deliveryStatus === "failed"
                            ? "bg-red-50/30"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] text-slate-400 font-mono w-6">#{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.deliveryStatus === "sending" && (
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] font-normal flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              Sending
                            </Badge>
                          )}
                          {item.deliveryStatus === "sent" && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-normal flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              Sent
                            </Badge>
                          )}
                          {item.deliveryStatus === "failed" && (
                            <Badge className="bg-red-100 text-red-800 text-[10px] font-normal flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5" />
                              Failed
                            </Badge>
                          )}
                          {item.deliveryStatus === "pending" && (
                            <Badge variant="outline" className="text-slate-400 text-[10px] font-normal">
                              Queued
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Completion Alert */}
              {!isSendingLive && liveRemainingCount === 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Bulk Dispatch Completed!</p>
                      <p className="text-emerald-700">
                        {liveSentCount} of {liveTotalCount} emails delivered successfully.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {liveFailedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={retryFailedEmails}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Retry Failed ({liveFailedCount})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={exportDeliveryReport}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Report (CSV)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Controls Footer */}
            <DialogFooter className="p-4 bg-slate-50 border-t flex items-center justify-between sm:justify-between">
              <div className="flex items-center gap-2">
                {isSendingLive ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={togglePause}
                    >
                      {isPausedLive ? (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      onClick={cancelSending}
                    >
                      <StopCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel Remaining
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={exportDeliveryReport}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export CSV
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant={isSendingLive ? "outline" : "default"}
                className="text-xs"
                disabled={isSendingLive}
                onClick={() => setIsBulkTrackerOpen(false)}
              >
                {isSendingLive ? "Sending in Background..." : "Close Tracker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL 2: INSPECT & SELECT BULK RECIPIENTS */}
        {/* ======================================================== */}
        <Dialog open={isRecipientModalOpen} onOpenChange={setIsRecipientModalOpen}>
          <DialogContent className="max-w-3xl p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Select Recipients ({selectedRecipientIds.size} of {recipientsList.length} chosen)
              </DialogTitle>
              <DialogDescription>
                Review or deselect individual volunteers before dispatching your email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search name, email, or form number..."
                    value={recipientSearchTerm}
                    onChange={(e) => setRecipientSearchTerm(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => setSelectedRecipientIds(new Set(recipientsList.map((r) => r.id)))}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => setSelectedRecipientIds(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <ScrollArea className="h-80">
                  <div className="divide-y text-xs">
                    {recipientsList
                      .filter(
                        (r) =>
                          r.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                          r.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                          r.formNo.includes(recipientSearchTerm)
                      )
                      .map((recipient) => {
                        const isChecked = selectedRecipientIds.has(recipient.id)
                        return (
                          <div
                            key={recipient.id}
                            className={`p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer ${
                              isChecked ? "bg-blue-50/30" : ""
                            }`}
                            onClick={() => {
                              const next = new Set(selectedRecipientIds)
                              if (isChecked) next.delete(recipient.id)
                              else next.add(recipient.id)
                              setSelectedRecipientIds(next)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => {}}
                                className="pointer-events-none"
                              />
                              <div>
                                <p className="font-semibold text-slate-900">{recipient.name}</p>
                                <p className="text-[11px] text-slate-500">{recipient.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {recipient.unitNo && (
                                <Badge variant="outline" className="text-[10px]">
                                  Unit {recipient.unitNo}
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{recipient.formNo}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                onClick={() => setIsRecipientModalOpen(false)}
              >
                Confirm ({selectedRecipientIds.size} Volunteers)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL 3: EMAIL LOG DETAILS VIEWER */}
        {/* ======================================================== */}
        <Dialog open={!!selectedLogDetail} onOpenChange={(open) => !open && setSelectedLogDetail(null)}>
          <DialogContent className="max-w-xl p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Delivery Record
              </DialogTitle>
              <DialogDescription>
                Sent on {selectedLogDetail && new Date(selectedLogDetail.sentAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {selectedLogDetail && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 font-semibold block">To</span>
                    <span className="font-medium text-slate-800">{selectedLogDetail.to}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Status</span>
                    <Badge
                      variant="outline"
                      className={`capitalize ${
                        selectedLogDetail.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-red-50 text-red-700 border-red-300"
                      }`}
                    >
                      {selectedLogDetail.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Subject</span>
                    <span className="font-medium text-slate-800">{selectedLogDetail.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Type</span>
                    <span className="capitalize text-slate-700">{selectedLogDetail.type || "single"}</span>
                  </div>
                </div>

                {selectedLogDetail.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="font-bold">Failure Reason:</p>
                    <p className="font-mono mt-0.5">{selectedLogDetail.error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 block">Rendered Content</span>
                  <div className="p-4 border rounded-lg bg-white max-h-60 overflow-y-auto leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {selectedLogDetail.content}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => setSelectedLogDetail(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
