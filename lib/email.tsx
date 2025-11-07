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

interface EventReminderData {
  name: string
  eventTitle: string
  eventDate: string
  startTime: string
  location?: string
}

export async function sendEventDayReminderEmail(to: string, data: EventReminderData) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Reminder: ${data.eventTitle} - Today at ${formatTime(data.startTime)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Event Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #f59e0b; margin-top: 0;">📅 Event Today!</h2>
          <p>Dear ${data.name},</p>
          <p>This is a reminder that you have an NSS event scheduled for <strong>today</strong>.</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">Event Details:</h3>
            <p style="margin: 8px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(data.startTime)}</p>
            <p style="margin: 8px 0;"><strong>Location:</strong> ${data.location || "Check event details"}</p>
          </div>

          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h4 style="margin: 0 0 10px 0; color: #991b1b;">⚠️ Important:</h4>
            <p style="margin: 0; color: #7f1d1d;">
              Please join the event on time at the specified location. If you fail to attend or do not mark your attendance, 
              you will be added to the defaulter list. This may affect your NSS participation status.
            </p>
          </div>

          <p>We look forward to seeing you at the event!</p>
          
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

interface AttendanceReminderData {
  name: string
  eventTitle: string
  eventDate: string
  startTime: string
}

export async function sendAttendanceReminderEmail(to: string, data: AttendanceReminderData) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Action Required: Mark Your Attendance for ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Attendance Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626; margin-top: 0;">⏰ Mark Your Attendance</h2>
          <p>Dear ${data.name},</p>
          <p>The event <strong>${data.eventTitle}</strong> has started, but we haven't received your starting attendance yet.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 15px 0; color: #991b1b;">⚠️ Action Required:</h3>
            <p style="margin: 8px 0; color: #7f1d1d;">
              Please mark your starting attendance immediately through your volunteer dashboard. 
              If you fail to mark your attendance within 30 minutes of the event start time, 
              you will be added to the defaulter list.
            </p>
            <p style="margin: 8px 0; color: #7f1d1d;">
              <strong>Event Start Time:</strong> ${formatTime(data.startTime)}
            </p>
          </div>

          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h4 style="margin: 0 0 10px 0; color: #065f46;">📱 How to Mark Attendance:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #047857;">
              <li>Login to your volunteer dashboard</li>
              <li>Go to the Events section</li>
              <li>Find the event and click "Start Event"</li>
              <li>Take a selfie with location verification</li>
            </ol>
          </div>

          <p>Please mark your attendance as soon as possible to avoid being marked as a defaulter.</p>
          
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

interface EndAttendanceReminderData {
  name: string
  eventTitle: string
  eventDate: string
  endTime: string
}

export async function sendEndAttendanceReminderEmail(to: string, data: EndAttendanceReminderData) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Action Required: Mark Your End Attendance for ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Attendance Reminder</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #dc2626; margin-top: 0;">⏰ Mark Your End Attendance</h2>
          <p>Dear ${data.name},</p>
          <p>The event <strong>${data.eventTitle}</strong> has ended, but we haven't received your end attendance yet.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 15px 0; color: #991b1b;">⚠️ Action Required:</h3>
            <p style="margin: 8px 0; color: #7f1d1d;">
              Please mark your end attendance immediately through your volunteer dashboard. 
              If you fail to mark your end attendance within 30 minutes of the event end time, 
              your working hours will not be added to your record.
            </p>
            <p style="margin: 8px 0; color: #7f1d1d;">
              <strong>Event End Time:</strong> ${formatTime(data.endTime)}
            </p>
          </div>

          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h4 style="margin: 0 0 10px 0; color: #065f46;">📱 How to Mark End Attendance:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #047857;">
              <li>Login to your volunteer dashboard</li>
              <li>Go to the Events section</li>
              <li>Find the event and click "End Event"</li>
              <li>Take a selfie with location verification</li>
            </ol>
          </div>

          <p><strong>Important:</strong> Your working hours will only be added if you mark both start and end attendance within 30 minutes of the respective times.</p>
          
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

interface DefaulterEmailData {
  name: string
  eventTitle: string
  eventDate: string
  defaulterCount: number
  reason: string
}

export async function sendDefaulterEmail(to: string, data: DefaulterEmailData) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const reasonText = {
    not_registered: "You did not register for this event and did not provide a reason for non-attendance.",
    not_attended: "You registered for this event but did not attend.",
    no_start_attendance: "You did not mark your starting attendance within the required time.",
    no_end_attendance: "You did not mark your end attendance within the required time.",
  }

  const remainingChances = 3 - data.defaulterCount
  const isRemoved = data.defaulterCount >= 3

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: isRemoved
      ? "Important: Your NSS Participation Status - Action Required"
      : `Defaulter Notice: ${data.eventTitle} - ${data.defaulterCount} of 3 Warnings`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${isRemoved ? "#dc2626" : "#f59e0b"}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NSS Defaulter Notice</h1>
        </div>
        <div style="padding: 20px; background-color: white;">
          ${isRemoved ? (
            `<h2 style="color: #dc2626; margin-top: 0;">🚫 Removal from NSS</h2>
            <p>Dear ${data.name},</p>
            <p>We regret to inform you that due to repeated non-attendance at NSS events, you have been removed from the NSS program.</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin: 0 0 15px 0; color: #991b1b;">Removal Details:</h3>
              <p style="margin: 8px 0;"><strong>Total Defaulter Count:</strong> ${data.defaulterCount} times</p>
              <p style="margin: 8px 0;"><strong>Last Event:</strong> ${data.eventTitle}</p>
              <p style="margin: 8px 0;"><strong>Event Date:</strong> ${formatDate(data.eventDate)}</p>
              <p style="margin: 8px 0;"><strong>Reason:</strong> ${reasonText[data.reason as keyof typeof reasonText]}</p>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">📞 Next Steps:</h4>
              <p style="margin: 0; color: #78350f;">
                If you wish to appeal this decision or have any questions regarding your removal, 
                please contact the NSS administration team immediately. You may be eligible for 
                reinstatement after a review process.
              </p>
            </div>

            <p>Please contact the admin team for the elimination process and any further inquiries.</p>`
          ) : (
            `<h2 style="color: #f59e0b; margin-top: 0;">⚠️ Defaulter Notice</h2>
            <p>Dear ${data.name},</p>
            <p>You have been added to the defaulter list for the following event:</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin: 0 0 15px 0; color: #991b1b;">Event Details:</h3>
              <p style="margin: 8px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
              <p style="margin: 8px 0;"><strong>Reason:</strong> ${reasonText[data.reason as keyof typeof reasonText]}</p>
            </div>

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin: 0 0 15px 0; color: #92400e;">⚠️ Important Warning:</h3>
              <p style="margin: 8px 0; color: #78350f;">
                <strong>Current Defaulter Count:</strong> ${data.defaulterCount} of 3 maximum warnings
              </p>
              <p style="margin: 8px 0; color: #78350f;">
                You have <strong>${remainingChances} more chance${remainingChances !== 1 ? "s" : ""}</strong> before being removed from the NSS program.
              </p>
              <p style="margin: 8px 0; color: #78350f;">
                If you miss ${remainingChances === 1 ? "one more event" : `${remainingChances} more events`}, 
                you will be removed from NSS.
              </p>
            </div>

            <p>We strongly encourage you to attend all future events and mark your attendance on time to avoid further warnings.</p>`
          )}
          
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