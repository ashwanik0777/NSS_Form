"use client"

import { useState } from "react"

export default function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter an email address")
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          name: "Test User",
          applicationId: "TEST123",
          institutionName: "Test Institution",
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Error sending test email",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Email System Test</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Test Email Address</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            placeholder="Enter email to test"
          />
        </div>
        <button
          onClick={sendTestEmail}
          disabled={sending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Test Email"}
        </button>

        {result && (
          <div
            className={`p-3 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
