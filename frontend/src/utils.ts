import { AxiosError } from "axios"
import type { ApiError } from "./client"

/**
 * Extract error message from API error response
 */
function extractErrorMessage(err: ApiError): string {
  if (err instanceof AxiosError) {
    return err.message
  }

  const errDetail = (err.body as any)?.detail
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return errDetail[0].msg
  }
  return errDetail || "Something went wrong."
}

/**
 * Handle API errors and show toast notification
 */
export const handleError = function (
  this: (msg: string) => void,
  err: ApiError,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
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
      } catch (error) {
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
