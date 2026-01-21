// Legacy service - only kept for updateCategory method which is not available in generated client
// TODO: Add updateCategory to OpenAPI schema and regenerate client, then remove this file

import { client } from "@/client"

const getApiUrl = (path: string): string => {
  const base = client.getConfig().baseURL || ""
  return `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface DocumentCategory {
  id: string
  name: string
  created_at: string
}

/**
 * Update document category
 * TODO: Replace with DocumentsService.documentsUpdateCategory when available in client
 */
export const DocumentsService = {
  async updateCategory(categoryId: string, name: string): Promise<DocumentCategory> {
    const response = await fetch(getApiUrl(`/documents/categories/${categoryId}`), {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      } as HeadersInit,
      body: JSON.stringify({ name }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to update category")
    }
    return response.json()
  },
}
