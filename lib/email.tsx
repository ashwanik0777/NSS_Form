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

interface EventNotificationData {
  name: string
  eventTitle: string
  eventDescription: string
  eventDate: string
  startTime?: string
  endTime?: string
  location?: string
  coordinator?: string
}

export async function sendEventNotificationEmail(to: string, data: EventNotificationData) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return "TBA"
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const calculateHours = () => {
    if (!data.startTime || !data.endTime) return "TBA"
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return `${hours.toFixed(1)} hours`
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `New NSS Event: ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Event Notification</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #1e40af; margin-top: 0;">📅 New Event Announced</h2>
          <p>Dear ${data.name},</p>
          <p>A new NSS event has been scheduled for your project. We invite you to participate!</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Event Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563; width: 140px;">Event Title:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Description:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.eventDescription}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formatDate(data.eventDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Time:</td>
                <td style="padding: 8px 0; color: #1f2937;">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Duration:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${calculateHours()} (Maximum hours)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Location:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.location || "TBA"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Coordinator:</td>
                <td style="padding: 8px 0; color: #1f2937;">${data.coordinator || "TBA"}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Important Instructions:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
              <li>Please attend the event on time</li>
              <li>You will receive attendance credit based on your actual participation time</li>
              <li>Maximum hours available: ${calculateHours()} (full event duration)</li>
              <li>If you leave early, you will receive hours only for the time you attended</li>
              <li>You must be at the event location to start and end your participation</li>
              <li>Location verification is required for both start and end</li>
            </ul>
          </div>

          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h4 style="margin: 0 0 10px 0; color: #065f46;">📱 How to Participate:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #047857;">
              <li>Login to your volunteer dashboard on the event day</li>
              <li>Go to the Events section</li>
              <li>Click "Start Event" and take a selfie with location</li>
              <li>Participate in the event activities</li>
              <li>When leaving, click "End Event" and take another selfie with location</li>
              <li>Hours will be calculated automatically based on your participation time</li>
            </ol>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            <strong>Note:</strong> Your attendance hours will be calculated based on the time between your start and end check-ins, up to the maximum event duration.
          </p>

          <p>We look forward to your active participation!</p>
          
          <p>Best regards,<br>NSS Event Management Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendCustomEmail(to: string, subject: string, content: string) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">NSS Registration System</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          ${content.replace(/\n/g, "<br>")}
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This email was sent from NSS Registration System</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
