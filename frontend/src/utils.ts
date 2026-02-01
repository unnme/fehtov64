import { AxiosError } from "axios"

interface ApiErrorDetail {
  msg?: string
  [key: string]: unknown
}

interface ApiErrorData {
  detail?: string | ApiErrorDetail[]
  error?: { detail?: string }
  message?: string
  response?: { data?: { detail?: string } }
}

/**
 * Extract error message from API error response
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const errorData = err.response?.data as ApiErrorData | undefined
    if (errorData?.detail) {
      if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        const first = errorData.detail[0]
        return typeof first === 'string' ? first : (first.msg || String(first))
      }
      return String(errorData.detail)
    }
    return err.message || "Что-то пошло не так."
  }

  if (err && typeof err === "object") {
    const errObj = err as ApiErrorData
    const detail = errObj?.error?.detail ?? errObj?.detail ?? errObj?.response?.data?.detail
    if (detail) {
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0]
        return typeof first === 'string' ? first : (first.msg || String(first))
      }
      return String(detail)
    }
    if (typeof errObj?.message === "string") {
      return errObj.message
    }
  }

  return "Что-то пошло не так."
}

/**
 * Handle API errors and show toast notification
 */
export const handleError = function (
  this: (msg: string) => void,
  err: unknown,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

/**
 * API response wrapper type
 */
interface ApiResponse<T> {
  data?: T
  error?: unknown
  response?: { status?: number }
}

/**
 * Custom error type that includes HTTP status
 */
export interface ApiError {
  detail?: string
  status?: number
  [key: string]: unknown
}

/**
 * Unwrap API response - extracts data or throws error with status
 */
export async function unwrapResponse<T>(
  promise: Promise<ApiResponse<T>>
): Promise<T> {
  const response = await promise
  if ('error' in response && response.error) {
    const error = response.error as Record<string, unknown>
    const status = response.response?.status
    throw { ...error, status } as ApiError
  }
  return response.data as T
}

/**
 * Get user initials from full name
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/**
 * Get client IP address using external services with fallback
 */
export async function getClientIP(): Promise<string | null> {
  try {
    // Use multiple services for reliability
    const services = [
      "https://api.ipify.org?format=json",
      "https://ipapi.co/json/",
      "https://api.myip.com",
    ]

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          // 2 second timeout
          signal: AbortSignal.timeout(2000),
        })

        if (response.ok) {
          const data = await response.json()
          // Different services return IP in different fields
          const ip =
            data.ip || data.query || data.IPv4 || data.address || null
          if (ip) {
            return ip
          }
        }
      } catch {
        // Try next service
        continue
      }
    }

    return null
  } catch (error) {
    console.error("Failed to get client IP:", error)
    return null
  }
}

/**
 * Get client IP with sessionStorage caching to avoid repeated requests
 */
export async function getCachedClientIP(): Promise<string | null> {
  const cacheKey = "client_ip_cache"
  const cacheTime = 5 * 60 * 1000 // 5 minutes

  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    const { ip, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < cacheTime) {
      return ip
    }
  }

  const ip = await getClientIP()
  if (ip) {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ ip, timestamp: Date.now() }),
    )
  }

  return ip
}
