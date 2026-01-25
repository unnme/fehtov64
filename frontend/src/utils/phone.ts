function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatPhone(value: string) {
  const digits = getPhoneDigits(value)
  const normalized = digits.startsWith("7")
    ? digits.slice(1)
    : digits.startsWith("8")
      ? digits.slice(1)
      : digits
  const trimmed = normalized.slice(0, 10)

  if (!trimmed) return "+7"

  const part1 = trimmed.slice(0, 3)
  const part2 = trimmed.slice(3, 6)
  const part3 = trimmed.slice(6, 8)
  const part4 = trimmed.slice(8, 10)

  if (trimmed.length <= 3) return `+7 (${part1}`
  if (trimmed.length <= 6) return `+7 (${part1}) ${part2}`
  if (trimmed.length <= 8) return `+7 (${part1}) ${part2}-${part3}`
  return `+7 (${part1}) ${part2}-${part3}-${part4}`
}

function isValidPhone(value: string) {
  const digits = getPhoneDigits(value)
  const normalized = digits.startsWith("7")
    ? digits.slice(1)
    : digits.startsWith("8")
      ? digits.slice(1)
      : digits
  return normalized.length === 10 && value.startsWith("+7")
}

export { formatPhone, isValidPhone }
