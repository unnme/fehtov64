import { client } from "@/client"

/**
 * Get document file download URL
 */
export const getDocumentFileUrl = (documentId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/documents/${documentId}/file`
}

/**
 * Get document file preview URL (opens in browser)
 */
export const getDocumentPreviewUrl = (documentId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/documents/${documentId}/file?inline=true`
}

/**
 * Get image file URL
 */
export const getImageFileUrl = (newsId: string, imageId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/news/${newsId}/images/${imageId}/file`
}

/**
 * Get person image file URL
 */
export const getPersonImageFileUrl = (personId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/persons/${personId}/image/file`
}

/**
 * MIME types that browsers can display inline
 */
const PREVIEWABLE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "application/json",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
])

/**
 * Check if file can be previewed in browser
 */
export const canPreviewInBrowser = (mimeType: string): boolean => {
  return PREVIEWABLE_MIME_TYPES.has(mimeType)
}
