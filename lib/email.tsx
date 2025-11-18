import nodemailer from "nodemailer"
import { generateNSSApplicationPDF } from "@/lib/generateNSSApplicationPDF"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

transporter.verify((error, success) => {
  if (error) {
    console.log("[v0] SMTP connection error:", error)
  } else {
    console.log("[v0] SMTP server is ready to take our messages")
  }
})

interface ApplicationSubmittedData {
  name: string
  applicationId: string
  institutionName: string
}

interface ApplicationApprovedData {
  name: string
  applicationId: string
  institutionName: string
  formData?: any // For PDF generation
  credentials?: { email: string; password: string } // <-- add this
}

interface ApplicationRejectedData {
  name: string
  applicationId: string
  rejectionReason: string
}

export async function sendApplicationSubmittedEmail(to: string, data: ApplicationSubmittedData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Application Submitted Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Registration System</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #333;">Application Submitted Successfully!</h2>
          <p>Dear ${data.name},</p>
          <p>Your NSS volunteer application has been submitted successfully and is now under review.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Application Details:</h3>
            <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
            <p style="margin: 5px 0;"><strong>Institution:</strong> ${data.institutionName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Under Review</p>
          </div>
          
          <p>We will review your application and notify you of the decision via email. This process typically takes 3-5 business days.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>NSS Registration Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendApplicationApprovedEmail(
  to: string,
  {
    name,
    applicationId,
    institutionName,
    formData,
    credentials, // <-- add this
  }: {
    name: string
    applicationId: string
    institutionName: string
    formData: any
    credentials?: { email: string; password: string } // <-- add this
  },
) {
  let attachments = [];
  if (formData) {
    try {
      const pdfBytes = await generateNSSApplicationPDF(formData);
      attachments.push({
        filename: `NSS_Application_${applicationId}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      });
    } catch (err) {
      console.error("Failed to generate PDF for approval email", err);
    }
  }

  let credentialsSection = "";
  if (credentials) {
    credentialsSection = `
      <h3>Your Volunteer Account Details</h3>
      <p>
        <b>Login Email:</b> ${credentials.email}<br/>
        <b>Password:</b> ${credentials.password}<br/>
        <i>Please change your password after first login.</i>
      </p>
      <hr/>
    `;
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Application Approved - Welcome to NSS!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Registration System</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #059669;">🎉 Congratulations! Your Application is Approved</h2>
          <p>Dear ${name},</p>
          <p>We are pleased to inform you that your NSS volunteer application has been <strong>approved</strong>!</p>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Application Details:</h3>
            <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
            <p style="margin: 5px 0;"><strong>Institution:</strong> ${institutionName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ✅ Approved</p>
          </div>
          
          ${credentialsSection}
          
          <p>Welcome to the NSS family! You are now officially registered as an NSS volunteer.</p>
          
          <h3 style="color: #374151;">Next Steps:</h3>
          <ul style="color: #4b5563;">
            <li>You will receive further instructions about orientation and training sessions</li>
            <li>Keep checking your email for updates about NSS activities and events</li>
            <li>Contact your NSS coordinator for any queries</li>
          </ul>
          
          <p>We look forward to your active participation in NSS activities and community service.</p>
          
          <p>Best regards,<br>NSS Registration Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
    attachments,
  }

  await transporter.sendMail(mailOptions)
}

// Report & Issue Management Email Functions
interface ReportSubmittedData {
  name: string
  reportId: string
  subject: string
  category: string
  priority: string
}

export async function sendReportSubmittedEmail(to: string, data: ReportSubmittedData) {
  const categoryLabels: Record<string, string> = {
    problem: "Problem",
    complaint: "Complaint",
    suggestion: "Suggestion",
    bug: "Bug Report",
    "event-issue": "Event Issue",
    "volunteer-issue": "Volunteer Issue",
    other: "Other",
  }

  const priorityColors: Record<string, string> = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#ef4444",
    urgent: "#dc2626",
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Report Submitted: ${data.reportId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Report Submitted Successfully</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #1e40af; margin-top: 0;">✅ Your Report Has Been Received</h2>
          <p>Dear ${data.name},</p>
          <p>Thank you for submitting your report. We have received it and will review it shortly.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Report Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Report ID:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Category:</td>
                <td style="padding: 8px 0; color: #1f2937;">${categoryLabels[data.category] || data.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Priority:</td>
                <td style="padding: 8px 0; color: ${priorityColors[data.priority] || "#4b5563"}; font-weight: bold;">
                  ${data.priority.toUpperCase()}
                </td>
              </tr>
            </table>
          </div>

          <p style="margin-top: 20px;">You can track the status of your report from your dashboard. We will notify you when there are any updates.</p>
          
          <p>Best regards,<br>NSS Support Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Report Management System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface ReportStatusUpdateData {
  name: string
  reportId: string
  subject: string
  status: string
  message?: string
  adminName?: string
}

export async function sendReportStatusUpdateEmail(to: string, data: ReportStatusUpdateData) {
  const statusLabels: Record<string, string> = {
    open: "Open",
    "in-progress": "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    cancelled: "Cancelled",
  }

  const statusColors: Record<string, string> = {
    open: "#3b82f6",
    "in-progress": "#f59e0b",
    resolved: "#10b981",
    closed: "#6b7280",
    cancelled: "#ef4444",
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Report Update: ${data.reportId} - ${statusLabels[data.status]}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${statusColors[data.status] || "#1e40af"}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Report Status Updated</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: ${statusColors[data.status] || "#1e40af"}; margin-top: 0;">📋 Status Update</h2>
          <p>Dear ${data.name},</p>
          <p>Your report has been updated with a new status.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[data.status] || "#1e40af"};">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Report Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Report ID:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">New Status:</td>
                <td style="padding: 8px 0; color: ${statusColors[data.status] || "#1f2937"}; font-weight: bold;">
                  ${statusLabels[data.status] || data.status}
                </td>
              </tr>
              ${data.adminName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Updated By:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.adminName}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          ${data.message ? `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Message:</strong></p>
            <p style="margin: 8px 0 0 0; color: #6b7280;">${data.message}</p>
          </div>
          ` : ""}

          <p style="margin-top: 20px;">You can view the full details and reply from your dashboard.</p>
          
          <p>Best regards,<br>NSS Support Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Report Management System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface ReportReplyData {
  name: string
  reportId: string
  subject: string
  replyMessage: string
  repliedBy: string
  isAdmin: boolean
}

export async function sendReportReplyEmail(to: string, data: ReportReplyData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `New Reply on Report: ${data.reportId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Reply on Your Report</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #1e40af; margin-top: 0;">💬 You Have a New Reply</h2>
          <p>Dear ${data.name},</p>
          <p>You have received a new reply on your report.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Report Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Report ID:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Subject:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Replied By:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.repliedBy} ${data.isAdmin ? "<span style='background-color: #1e40af; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;'>Admin</span>" : ""}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Reply Message:</strong></p>
            <p style="margin: 8px 0 0 0; color: #6b7280; white-space: pre-wrap;">${data.replyMessage}</p>
          </div>

          <p style="margin-top: 20px;">You can view and reply to this message from your dashboard.</p>
          
          <p>Best regards,<br>NSS Support Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Report Management System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}


export async function sendApplicationRejectedEmail(to: string, data: ApplicationRejectedData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Application Status Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Registration System</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626;">Application Status Update</h2>
          <p>Dear ${data.name},</p>
          <p>Thank you for your interest in joining NSS. After careful review, we regret to inform you that your application could not be approved at this time.</p>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 10px 0; color: #991b1b;">Application Details:</h3>
            <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ❌ Not Approved</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>
          </div>
          
          <h3 style="color: #374151;">What's Next?</h3>
          <ul style="color: #4b5563;">
            <li>You may reapply in the next registration cycle</li>
            <li>Please address the issues mentioned in the reason above</li>
            <li>Contact our support team if you need clarification</li>
          </ul>
          
          <p>We encourage you to apply again in the future. Thank you for your understanding.</p>
          
          <p>Best regards,<br>NSS Registration Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
