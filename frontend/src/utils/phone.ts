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

/**
 * Formats phone number for display.
 * Supports formats: +7 (XXX) XXX-XX-XX, 8 (XXX) XXX-XX-XX, (XXX) XXX-XX-XX
 */
export function formatPhoneDisplay(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return `8 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  } else if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
  }
  return phoneNumber
}

/**
 * Normalizes phone from old format (string) or new format (object) to unified format.
 */
export function normalizePhone(
  phone: string | { phone: string; description?: string | null } | undefined
): { phone: string; description?: string | null } | null {
  if (!phone) return null
  
  if (typeof phone === 'string') {
    return { phone, description: null }
  }
  
  if (phone && typeof phone === 'object') {
    return {
      phone: phone.phone || '',
      description: phone.description || null
    }
  }
  
  return null
}

export { formatPhone, isValidPhone }
