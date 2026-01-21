import { client } from "@/client"

/**
 * Get document file download URL
 */
export const getDocumentFileUrl = (documentId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/documents/${documentId}/file`
}

/**
 * Get image file URL
 */
export const getImageFileUrl = (newsId: string, imageId: string): string => {
  const baseURL = client.getConfig().baseURL || ""
  return `${baseURL}/api/v1/news/${newsId}/images/${imageId}/file`
}
