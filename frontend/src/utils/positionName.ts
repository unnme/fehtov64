function hasInnerWhitespace(value: string) {
  return /\s/.test(value)
}

function isValidPositionName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (hasInnerWhitespace(trimmed)) return false

  const parts = trimmed.split("-")
  if (parts.length > 2) return false
  if (parts.some((part) => part.length === 0)) return false
  return parts.every((part) => /^[\p{L}]+$/u.test(part))
}

function normalizePositionName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  const lower = trimmed.toLocaleLowerCase()
  const parts = lower.split("-")
  if (parts.length === 0) return trimmed

  const first = parts[0]
  const normalizedFirst = first
    ? first[0]?.toLocaleUpperCase() + first.slice(1)
    : first

  if (parts.length === 1) return normalizedFirst
  return [normalizedFirst, ...parts.slice(1)].join("-")
}

export { isValidPositionName, normalizePositionName }
