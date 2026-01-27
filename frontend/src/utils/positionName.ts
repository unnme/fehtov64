function isValidPositionName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const normalized = trimmed.replace(/\s+/g, " ")
  return /^[\p{L} ]+$/u.test(normalized)
}

function normalizePositionName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  const normalized = trimmed.replace(/\s+/g, " ")
  const first = normalized[0]
  return first ? first.toLocaleUpperCase() + normalized.slice(1) : normalized
}

export { isValidPositionName, normalizePositionName }
