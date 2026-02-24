const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const normalizeUnitNo = (value?: string | null) => {
  const raw = (value || "").trim()
  if (!raw) return ""

  const match = raw.match(/(\d+)/)
  if (match?.[1]) {
    return String(Number(match[1]))
  }

  return raw.replace(/^unit\s*/i, "").trim()
}

export const getUnitNoQuery = (value?: string | null) => {
  const normalized = normalizeUnitNo(value)
  if (!normalized) {
    return { $exists: false }
  }

  return {
    $regex: new RegExp(`^\\s*(?:unit\\s*)?${escapeRegex(normalized)}\\s*$`, "i"),
  }
}
