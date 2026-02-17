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
         <b>https://nss-gbu.collcom.org/login</b>
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

interface PasswordResetOTPData {
  name: string
  otp: string
}

export async function sendPasswordResetOTPEmail(to: string, data: PasswordResetOTPData) {
  const appUrl = process.env.NEXTAUTH_URL || "https://nss.gov.in"

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Volunteer Password Reset Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1d4ed8; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0;">NSS Volunteer Security</h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p>Namaste ${data.name.split(" ")[0] || "Volunteer"},</p>
          <p>We received a request from the NSS administration team to reset the password for your volunteer portal account.</p>
          <p style="margin: 16px 0;">Please share the following One-Time Password (OTP) with the NSS administrator to continue:</p>
          <div style="background: #f3f4f6; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; color: #111827;">
            ${data.otp}
          </div>
          <p style="margin: 18px 0 4px 0; color: #ef4444; font-weight: 600;">Important:</p>
          <ul style="color: #4b5563; padding-left: 20px; line-height: 1.6;">
            <li>This OTP will expire in <strong>10 minutes</strong>.</li>
            <li>Do not share this code with anyone else.</li>
            <li>If you did not request this change, please contact your NSS coordinator immediately.</li>
          </ul>
          <p>After the NSS team verifies this OTP, you will receive a confirmation email with your temporary password and instructions.</p>
          <p style="margin-top: 20px;">Regards,<br/>NSS Digital Support Team<br/><a href="${appUrl}" style="color: #1d4ed8;">${appUrl}</a></p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface PasswordResetConfirmationData {
  name: string
  temporaryPassword: string
}

interface VolunteerSelfResetOTPData {
  name: string
  otp: string
}

export async function sendVolunteerSelfResetOTPEmail(to: string, data: VolunteerSelfResetOTPData) {
  const appUrl = process.env.NEXTAUTH_URL || "https://nss.gov.in"

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Volunteer Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1d4ed8; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0;">NSS Volunteer Password Reset</h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p>Namaste ${data.name.split(" ")[0] || "Volunteer"},</p>
          <p>You requested to reset your NSS volunteer portal password.</p>
          <p style="margin: 16px 0;">Use this OTP to verify your request:</p>
          <div style="background: #f3f4f6; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; color: #111827;">
            ${data.otp}
          </div>
          <p style="margin: 18px 0 4px 0; color: #ef4444; font-weight: 600;">Important:</p>
          <ul style="color: #4b5563; padding-left: 20px; line-height: 1.6;">
            <li>This OTP will expire in <strong>10 minutes</strong>.</li>
            <li>Do not share this code with anyone.</li>
            <li>If you did not request this reset, ignore this email.</li>
          </ul>
          <p style="margin-top: 20px;">Regards,<br/>NSS Digital Support Team<br/><a href="${appUrl}" style="color: #1d4ed8;">${appUrl}</a></p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendPasswordResetConfirmationEmail(to: string, data: PasswordResetConfirmationData) {
  const loginUrl = `${process.env.NEXTAUTH_URL || "https://nss.gov.in"}/login`

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "NSS Volunteer Password Reset Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #047857; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0;">Password Reset Completed</h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p>Dear ${data.name},</p>
          <p>Your NSS volunteer portal password has been reset by the administration team after verifying your OTP.</p>
          <div style="background: #ecfdf5; padding: 18px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">Temporary Login Password</p>
            <p style="font-size: 20px; font-weight: bold; color: #047857; letter-spacing: 1px;">${data.temporaryPassword}</p>
          </div>
          <p>Please use this password to log in and update it immediately for your security.</p>
          <ol style="color: #4b5563; padding-left: 20px; line-height: 1.6;">
            <li>Go to <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>.</li>
            <li>Login with your registered email and the temporary password above.</li>
            <li>Follow the prompt to set a new personal password.</li>
          </ol>
          <p>If you did not authorize this change, contact your NSS coordinator right away.</p>
          <p style="margin-top: 20px;">Stay secure,<br/>NSS Digital Support Team</p>
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

// Generic custom email function
export async function sendCustomEmail(to: string, subject: string, htmlContent: string) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Announcement</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          ${htmlContent}
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Event and Attendance Email Functions
interface EventDayReminderData {
  name: string
  eventTitle: string
  eventDate: string
  startTime: string
  location?: string
}

export async function sendEventDayReminderEmail(to: string, data: EventDayReminderData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Event Reminder: ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Event Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #1e40af; margin-top: 0;">📅 Event Reminder</h2>
          <p>Dear ${data.name},</p>
          <p>This is a reminder that you have an event scheduled for today.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Event Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Event:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
              ${data.location ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Location:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.location}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">⚠️ Important: Please join on time at ${data.location || "the specified location"}, otherwise you will be added to the defaulter list.</p>
          
          <p>Best regards,<br>NSS Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface AttendanceReminderData {
  name: string
  eventTitle: string
  eventDate: string
  startTime: string
}

export async function sendAttendanceReminderEmail(to: string, data: AttendanceReminderData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `URGENT: Mark Your Attendance - ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Attendance Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626; margin-top: 0;">Event Starting Soon - Mark Your Attendance</h2>
          <p>Dear ${data.name},</p>
          <p>The event is about to start and you need to mark your starting attendance on time.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 15px 0; color: #991b1b;">Event Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Event:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Start Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            </table>
          </div>

          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
            ⚠️ Please mark your starting attendance through your dashboard before the event window closes.
            Attendance is allowed from <strong>1 hour before</strong> the event start time until <strong>1 hour after</strong> the event end time. 
            If you fail to mark your attendance in this window, you may be marked as defaulter.
          </p>
          
          <p>Best regards,<br>NSS Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface EndAttendanceReminderData {
  name: string
  eventTitle: string
  eventDate: string
  endTime: string
}

export async function sendEndAttendanceReminderEmail(to: string, data: EndAttendanceReminderData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `URGENT: Mark Your End Attendance - ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ End Attendance Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626; margin-top: 0;">Event Ending Soon - Mark Your End Attendance</h2>
          <p>Dear ${data.name},</p>
          <p>The event is about to end and you need to mark your end attendance on time.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 15px 0; color: #991b1b;">Event Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Event:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">End Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(data.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            </table>
          </div>

          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
            ⚠️ Please mark your end attendance through your dashboard before the event window closes.
            Attendance is allowed from <strong>1 hour before</strong> the event start time until <strong>1 hour after</strong> the event end time. 
            If you fail to mark your end attendance in this window, your working hours may not be added to your record.
          </p>
          
          <p>Best regards,<br>NSS Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface EventNotificationData {
  name: string
  eventTitle: string
  eventDescription: string
  eventDate: string | Date
  startTime: string
  endTime: string
  location: string
  coordinator: string
}

export async function sendEventNotificationEmail(to: string, data: EventNotificationData) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `New NSS Event: ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New NSS Event Announcement</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #1e3a8a;">📅 New Event: ${data.eventTitle}</h2>
          <p>Dear ${data.name},</p>
          <p>A new event has been scheduled. Please check the details below:</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>
            <p style="margin: 5px 0;"><strong>Coordinator:</strong> ${data.coordinator}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Description:</h3>
            <p style="margin: 0; color: #4b5563;">${data.eventDescription}</p>
          </div>
          
          <p>Please log in to the portal to register for this event.</p>
          
          <p>Best regards,<br>NSS Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

interface DefaulterNotificationData {
  name: string
  eventTitle: string
  eventDate: string | Date
  defaulterCount: number
  reason: string
}

export async function sendDefaulterEmail(to: string, data: DefaulterNotificationData) {
  const isRemoved = data.defaulterCount >= 3
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `NSS Attendance Warning - ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Attendance Warning</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626;">⚠️ Absent from Event</h2>
          <p>Dear ${data.name},</p>
          <p>You have been marked as absent/defaulter for the following event:</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>
          </div>

          <div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fda4af;">
            <h3 style="margin: 0 0 10px 0; color: #991b1b;">Defaulter Status:</h3>
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #ef4444;">
              Count: ${data.defaulterCount} / 3
            </p>
            ${isRemoved 
              ? `<p style="color: #dc2626; font-weight: bold; margin-top: 10px;">
                   CRITICAL: You have reached the maximum allowed defaulter limit. You have been removed from the active volunteer list.
                 </p>`
              : `<p style="color: #4b5563; font-size: 14px; margin-top: 10px;">
                   Please note: 3 defaulter marks will result in removal from the NSS program.
                 </p>`
            }
          </div>
          
          <p>If you believe this is a mistake, please contact the program coordinator immediately.</p>
          
          <p>Best regards,<br>NSS Disciplinary Committee</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
