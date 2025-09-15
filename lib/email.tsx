import nodemailer from "nodemailer"

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Email templates
export const emailTemplates = {
  applicationSubmitted: (data: {
    name: string
    applicationId: string
    institutionName: string
  }): EmailTemplate => ({
    subject: "NSS Application Submitted Successfully - राष्ट्रीय सेवा योजना",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>National Service Scheme</h1>
              <p>राष्ट्रीय सेवा योजना - उत्तर प्रदेश</p>
            </div>
            <div class="content">
              <h2>Application Submitted Successfully!</h2>
              <p>Dear ${data.name},</p>
              <p>Your NSS volunteer application has been successfully submitted. Here are your application details:</p>
              <ul>
                <li><strong>Application ID:</strong> ${data.applicationId}</li>
                <li><strong>Institution:</strong> ${data.institutionName}</li>
                <li><strong>Submitted Date:</strong> ${new Date().toLocaleDateString("en-IN")}</li>
              </ul>
              <p>Your application is now under review. You will receive an email notification once the review is complete.</p>
              <p><strong>Important:</strong> Please save your Application ID for future reference.</p>
              
              <h3>हिंदी में / In Hindi:</h3>
              <p>प्रिय ${data.name},</p>
              <p>आपका NSS स्वयंसेवक आवेदन सफलतापूर्वक जमा किया गया है। आपके आवेदन की समीक्षा की जा रही है और परिणाम की सूचना ईमेल द्वारा भेजी जाएगी।</p>
            </div>
            <div class="footer">
              <p>Government of India | भारत सरकार</p>
              <p>National Service Scheme - Uttar Pradesh</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      National Service Scheme - Application Submitted
      
      Dear ${data.name},
      
      Your NSS volunteer application has been successfully submitted.
      
      Application ID: ${data.applicationId}
      Institution: ${data.institutionName}
      Submitted Date: ${new Date().toLocaleDateString("en-IN")}
      
      Your application is now under review. You will receive an email notification once the review is complete.
      
      Please save your Application ID for future reference.
      
      Government of India
      National Service Scheme - Uttar Pradesh
    `,
  }),

  applicationApproved: (data: {
    name: string
    applicationId: string
    institutionName: string
  }): EmailTemplate => ({
    subject: "NSS Application Approved - Congratulations! - राष्ट्रीय सेवा योजना",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f0fdf4; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>National Service Scheme - राष्ट्रीय सेवा योजना</p>
            </div>
            <div class="content">
              <div class="success-badge">✅ APPLICATION APPROVED</div>
              <h2>Your NSS Application has been Approved!</h2>
              <p>Dear ${data.name},</p>
              <p>We are pleased to inform you that your NSS volunteer application has been <strong>approved</strong>.</p>
              <ul>
                <li><strong>Application ID:</strong> ${data.applicationId}</li>
                <li><strong>Institution:</strong> ${data.institutionName}</li>
                <li><strong>Approval Date:</strong> ${new Date().toLocaleDateString("en-IN")}</li>
              </ul>
              <p>You can now download your official NSS registration certificate and submit it to your institution office.</p>
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Download your registration certificate</li>
                <li>Submit the certificate to your institution</li>
                <li>Attend the NSS orientation program</li>
              </ol>
              
              <h3>हिंदी में / In Hindi:</h3>
              <p>प्रिय ${data.name},</p>
              <p>हमें आपको सूचित करते हुए खुशी हो रही है कि आपका NSS स्वयंसेवक आवेदन <strong>स्वीकृत</strong> हो गया है। बधाई हो!</p>
              <p>अब आप अपना आधिकारिक NSS पंजीकरण प्रमाणपत्र डाउनलोड कर सकते हैं।</p>
            </div>
            <div class="footer">
              <p>Government of India | भारत सरकार</p>
              <p>National Service Scheme - Uttar Pradesh</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Congratulations! Your NSS Application has been Approved
      
      Dear ${data.name},
      
      We are pleased to inform you that your NSS volunteer application has been approved.
      
      Application ID: ${data.applicationId}
      Institution: ${data.institutionName}
      Approval Date: ${new Date().toLocaleDateString("en-IN")}
      
      You can now download your official NSS registration certificate and submit it to your institution office.
      
      Next Steps:
      1. Download your registration certificate
      2. Submit the certificate to your institution
      3. Attend the NSS orientation program
      
      Congratulations and welcome to the NSS family!
      
      Government of India
      National Service Scheme - Uttar Pradesh
    `,
  }),

  applicationRejected: (data: {
    name: string
    applicationId: string
    rejectionReason: string
  }): EmailTemplate => ({
    subject: "NSS Application Status Update - राष्ट्रीय सेवा योजना",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #fef2f2; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .rejection-reason { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
              <p>National Service Scheme - राष्ट्रीय सेवा योजना</p>
            </div>
            <div class="content">
              <h2>Application Review Complete</h2>
              <p>Dear ${data.name},</p>
              <p>Thank you for your interest in the National Service Scheme. After careful review, we regret to inform you that your application (ID: ${data.applicationId}) could not be approved at this time.</p>
              
              <div class="rejection-reason">
                <h3>Reason for Non-Approval:</h3>
                <p>${data.rejectionReason}</p>
              </div>
              
              <p>Please note that this decision does not reflect on your commitment to service. You are welcome to reapply in the next enrollment cycle after addressing the mentioned concerns.</p>
              
              <h3>What you can do:</h3>
              <ul>
                <li>Review the reason mentioned above</li>
                <li>Address any documentation or eligibility issues</li>
                <li>Reapply in the next enrollment period</li>
                <li>Contact your institution's NSS coordinator for guidance</li>
              </ul>
              
              <h3>हिंदी में / In Hindi:</h3>
              <p>प्रिय ${data.name},</p>
              <p>राष्ट्रीय सेवा योजना में आपकी रुचि के लिए धन्यवाद। सावधानीपूर्वक समीक्षा के बाद, हमें खेद के साथ सूचित करना पड़ रहा है कि आपका आवेदन इस समय स्वीकृत नहीं किया जा सका।</p>
              <p>आप अगले नामांकन चक्र में पुनः आवेदन कर सकते हैं।</p>
            </div>
            <div class="footer">
              <p>Government of India | भारत सरकार</p>
              <p>National Service Scheme - Uttar Pradesh</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      NSS Application Status Update
      
      Dear ${data.name},
      
      Thank you for your interest in the National Service Scheme. After careful review, we regret to inform you that your application (ID: ${data.applicationId}) could not be approved at this time.
      
      Reason for Non-Approval:
      ${data.rejectionReason}
      
      Please note that this decision does not reflect on your commitment to service. You are welcome to reapply in the next enrollment cycle after addressing the mentioned concerns.
      
      What you can do:
      - Review the reason mentioned above
      - Address any documentation or eligibility issues
      - Reapply in the next enrollment period
      - Contact your institution's NSS coordinator for guidance
      
      Government of India
      National Service Scheme - Uttar Pradesh
    `,
  }),
}

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>,
) {
  try {
    const mailOptions = {
      from: `"NSS Uttar Pradesh" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Utility functions for sending specific emails
export const sendApplicationSubmittedEmail = async (
  email: string,
  data: { name: string; applicationId: string; institutionName: string },
) => {
  const template = emailTemplates.applicationSubmitted(data)
  return await sendEmail(email, template)
}

export const sendApplicationApprovedEmail = async (
  email: string,
  data: { name: string; applicationId: string; institutionName: string },
) => {
  const template = emailTemplates.applicationApproved(data)
  return await sendEmail(email, template)
}

export const sendApplicationRejectedEmail = async (
  email: string,
  data: { name: string; applicationId: string; rejectionReason: string },
) => {
  const template = emailTemplates.applicationRejected(data)
  return await sendEmail(email, template)
}
