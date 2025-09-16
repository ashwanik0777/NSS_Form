"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
  subject: string
  status: "sent" | "failed" | "pending"
  sentAt: string
  template?: string
  error?: string
}

interface BulkEmailData {
  recipients: string[]
  subject: string
  content: string
  templateId?: string
}

export default function EmailSystemPage() {
  const [activeTab, setActiveTab] = useState("compose")
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)

  // Compose Email State
  const [composeData, setComposeData] = useState({
    recipients: "",
    subject: "",
    content: "",
    templateId: "",
  })

  // Template State
  const [templateData, setTemplateData] = useState({
    name: "",
    subject: "",
    content: "",
    type: "custom" as const,
  })

  // Bulk Email State
  const [bulkEmailData, setBulkEmailData] = useState({
    recipientType: "all",
    customRecipients: "",
    subject: "",
    content: "",
    templateId: "",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const useTemplate = (template: EmailTemplate) => {
    if (activeTab === "compose") {
      setComposeData((prev) => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        templateId: template._id,
      }))
    } else if (activeTab === "bulk") {
      setBulkEmailData((prev) => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        templateId: template._id,
      }))
    }
    toast({
      title: "Template Applied",
      description: `Template "${template.name}" has been applied`,
    })
  }

  useEffect(() => {
    fetchTemplates()
    fetchEmailLogs()
  }, [])

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
      }
    } catch (error) {
      console.error("Error fetching email logs:", error)
    }
  }

  const sendSingleEmail = async () => {
    if (!composeData.recipients || !composeData.subject || !composeData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully",
        })
        setComposeData({ recipients: "", subject: "", content: "", templateId: "" })
        fetchEmailLogs()
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendBulkEmail = async () => {
    if (!bulkEmailData.subject || !bulkEmailData.content) {
      toast({
        title: "Error",
        description: "Please fill in subject and content",
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
          type: "bulk",
          recipientType: bulkEmailData.recipientType,
          customRecipients: bulkEmailData.customRecipients
            ? bulkEmailData.customRecipients.split(",").map((email) => email.trim())
            : [],
          subject: bulkEmailData.subject,
          content: bulkEmailData.content,
          templateId: bulkEmailData.templateId || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bulk email sent successfully",
        })
        setBulkEmailData({
          recipientType: "all",
          customRecipients: "",
          subject: "",
          content: "",
          templateId: "",
        })
        fetchEmailLogs()
      } else {
        throw new Error("Failed to send bulk email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!templateData.name || !templateData.subject || !templateData.content) {
      toast({
        title: "Error",
        description: "Please fill in all template fields",
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
          title: "Success",
          description: "Template saved successfully",
        })
        setTemplateData({ name: "", subject: "", content: "", type: "custom" })
        fetchTemplates()
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
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
          title: "Success",
          description: "Template deleted successfully",
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

  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      log.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email System</h1>
          <p className="text-muted-foreground">Manage email communications and templates</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Sent</p>
                <p className="text-2xl font-bold">{emailLogs.filter((log) => log.status === "sent").length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Email</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Compose Email
              </CardTitle>
              <CardDescription>Send individual emails to specific recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                  <Input
                    id="recipients"
                    placeholder="email1@example.com, email2@example.com"
                    value={composeData.recipients}
                    onChange={(e) => setComposeData((prev) => ({ ...prev, recipients: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-select">Use Template (Optional)</Label>
                  <Select
                    value={composeData.templateId}
                    onValueChange={(value) => {
                      const template = templates.find((t) => t._id === value)
                      if (template) {
                        setComposeData((prev) => ({
                          ...prev,
                          subject: template.subject,
                          content: template.content,
                          templateId: template._id,
                        }))
                        toast({
                          title: "Template Applied",
                          description: `Template "${template.name}" has been applied`,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Email content..."
                  rows={8}
                  value={composeData.content}
                  onChange={(e) => setComposeData((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <Button onClick={sendSingleEmail} disabled={loading} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Bulk Email
              </CardTitle>
              <CardDescription>Send emails to multiple recipients at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-type">Recipient Type</Label>
                  <Select
                    value={bulkEmailData.recipientType}
                    onValueChange={(value) => setBulkEmailData((prev) => ({ ...prev, recipientType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Registered Users</SelectItem>
                      <SelectItem value="approved">Approved Volunteers</SelectItem>
                      <SelectItem value="pending">Pending Applications</SelectItem>
                      <SelectItem value="rejected">Rejected Applications</SelectItem>
                      <SelectItem value="custom">Custom List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-template">Use Template (Optional)</Label>
                  <Select
                    value={bulkEmailData.templateId}
                    onValueChange={(value) => {
                      const template = templates.find((t) => t._id === value)
                      if (template) {
                        setBulkEmailData((prev) => ({
                          ...prev,
                          subject: template.subject,
                          content: template.content,
                          templateId: template._id,
                        }))
                        toast({
                          title: "Template Applied",
                          description: `Template "${template.name}" has been applied`,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {bulkEmailData.recipientType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-recipients">Custom Recipients (comma-separated)</Label>
                  <Textarea
                    id="custom-recipients"
                    placeholder="email1@example.com, email2@example.com, ..."
                    rows={3}
                    value={bulkEmailData.customRecipients}
                    onChange={(e) => setBulkEmailData((prev) => ({ ...prev, customRecipients: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bulk-subject">Subject</Label>
                <Input
                  id="bulk-subject"
                  placeholder="Email subject"
                  value={bulkEmailData.subject}
                  onChange={(e) => setBulkEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-content">Content</Label>
                <Textarea
                  id="bulk-content"
                  placeholder="Email content..."
                  rows={8}
                  value={bulkEmailData.content}
                  onChange={(e) => setBulkEmailData((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <Button onClick={sendBulkEmail} disabled={loading} className="w-full">
                <Users className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Bulk Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="Template name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-type">Type</Label>
                  <Select
                    value={templateData.type}
                    onValueChange={(value: any) => setTemplateData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    placeholder="Email subject"
                    value={templateData.subject}
                    onChange={(e) => setTemplateData((prev) => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-content">Content</Label>
                  <Textarea
                    id="template-content"
                    placeholder="Email content..."
                    rows={6}
                    value={templateData.content}
                    onChange={(e) => setTemplateData((prev) => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <Button onClick={saveTemplate} disabled={loading} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Template"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
                <CardDescription>Manage your email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template._id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setComposeData((prev) => ({
                                ...prev,
                                subject: template.subject,
                                content: template.content,
                                templateId: template._id,
                              }))
                              toast({
                                title: "Template Applied",
                                description: `Template "${template.name}" has been applied`,
                              })
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteTemplate(template._id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No templates created yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Email Logs
              </CardTitle>
              <CardDescription>Track all sent emails and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{log.subject}</p>
                          <p className="text-sm text-muted-foreground">To: {log.to}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(log.status)}
                        <p className="text-xs text-muted-foreground">{new Date(log.sentAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {log.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No email logs found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={process.env.SMTP_HOST || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input value={process.env.SMTP_PORT || ""} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input value={process.env.SMTP_USER || ""} disabled />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="auto-emails" />
                <Label htmlFor="auto-emails">Enable automatic status emails</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="email-notifications" />
                <Label htmlFor="email-notifications">Send admin notifications</Label>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
