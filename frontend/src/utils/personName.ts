function hasInnerWhitespace(value: string) {
  return /\s/.test(value)
}

function isValidNamePart(value: string) {
  return /^[\p{L}]+$/u.test(value)
}

function normalizeNamePart(value: string) {
  if (!value) return value
  const lower = value.toLocaleLowerCase()
  return lower[0]?.toLocaleUpperCase() + lower.slice(1)
}

function normalizePersonName(value: string, allowHyphen: boolean) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (hasInnerWhitespace(trimmed)) return trimmed

  if (!allowHyphen) {
    return normalizeNamePart(trimmed)
  }

  const parts = trimmed.split("-")
  if (parts.length > 2) return trimmed
  if (parts.some((part) => part.length === 0)) return trimmed

  return parts.map(normalizeNamePart).join("-")
}

function isValidPersonName(value: string, allowHyphen: boolean) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (hasInnerWhitespace(trimmed)) return false

  if (!allowHyphen) {
    return isValidNamePart(trimmed)
  }

  const parts = trimmed.split("-")
  if (parts.length > 2) return false
  if (parts.some((part) => part.length === 0)) return false
  return parts.every(isValidNamePart)
}

export { isValidPersonName, normalizePersonName }
