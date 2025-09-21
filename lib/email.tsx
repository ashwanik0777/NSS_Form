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

export async function sendApplicationApprovedEmail(to: string, data: ApplicationApprovedData) {
  let attachments = [];
  if (data.formData) {
    try {
      const pdfBytes = await generateNSSApplicationPDF(data.formData);
      attachments.push({
        filename: `NSS_Application_${data.applicationId}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      });
    } catch (err) {
      console.error("Failed to generate PDF for approval email", err);
    }
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
          <p>Dear ${data.name},</p>
          <p>We are pleased to inform you that your NSS volunteer application has been <strong>approved</strong>!</p>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Application Details:</h3>
            <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
            <p style="margin: 5px 0;"><strong>Institution:</strong> ${data.institutionName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ✅ Approved</p>
          </div>
          
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
