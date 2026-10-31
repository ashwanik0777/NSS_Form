/**
 * Email Formatter and Linkification Utilities
 * Isomorphic: Safe to use in both Server (API / Nodemailer) and Client (React Preview)
 */

export interface EmailPersonalizationData {
  name?: string
  unitNo?: string | number
  formNo?: string | number
  email?: string
}

/**
 * Replaces variables like {{name}}, {{unitNo}}, {{email}}, {{formNo}}
 */
export function replaceEmailVariables(text: string, data?: EmailPersonalizationData): string {
  if (!text) return ""
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, data?.name || "Volunteer")
    .replace(/\{\{\s*unitNo\s*\}\}/gi, data?.unitNo ? String(data.unitNo) : "NSS Unit")
    .replace(/\{\{\s*unit\s*\}\}/gi, data?.unitNo ? String(data.unitNo) : "NSS Unit")
    .replace(/\{\{\s*email\s*\}\}/gi, data?.email || "")
    .replace(/\{\{\s*formNo\s*\}\}/gi, data?.formNo ? String(data.formNo) : "")
    .replace(/\{\{\s*applicationId\s*\}\}/gi, data?.formNo ? String(data.formNo) : "")
}

/**
 * Detects pasted links, raw URLs (https://, http://, www.), and markdown links [Text](url),
 * converting them into safe, fully clickable, styled HTML hyperlinks with word-break for mobile safety.
 */
export function linkifyAndFormatContent(content: string): string {
  if (!content) return ""

  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  // 1. Convert markdown links: [Text](https://...)
  let processed = content.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-weight: 600; word-break: break-all;">$1</a>'
  )

  // 2. Convert raw URLs (http:// or https://) not already in href
  processed = processed.replace(/(?<!href=["'])(?<!>)(https?:\/\/[^\s<>"'\)]+)/gi, (match) => {
    let url = match
    let trailing = ""
    while (/[.,;:!?)]$/.test(url)) {
      trailing = url.slice(-1) + trailing
      url = url.slice(0, -1)
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-weight: 500; word-break: break-all;">${url}</a>${trailing}`
  })

  // 3. Convert www. URLs
  processed = processed.replace(/(?<!https?:\/\/)(?<!["'>])(www\.[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+[^\s<>"'\)]*)/gi, (match) => {
    let url = match
    let trailing = ""
    while (/[.,;:!?)]$/.test(url)) {
      trailing = url.slice(-1) + trailing
      url = url.slice(0, -1)
    }
    return `<a href="https://${url}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-weight: 500; word-break: break-all;">${url}</a>${trailing}`
  })

  // 4. If plain text, convert paragraph breaks to HTML
  if (!isHtml) {
    return processed
      .split(/\n\s*\n/)
      .map(
        (paragraph) =>
          `<p style="margin: 0 0 14px 0; color: #374151; font-size: 15px; line-height: 1.6; word-break: break-word;">${paragraph.replace(
            /\n/g,
            "<br/>"
          )}</p>`
      )
      .join("")
  }

  return processed
}

