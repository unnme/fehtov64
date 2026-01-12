// TODO: After client regeneration, import ImagesService and NewsImagePublic from "@/client"
// import { ImagesService, type NewsImagePublic } from "@/client"

import axios from "axios"
import { OpenAPI } from "@/client"

// Temporary type until OpenAPI client is regenerated
export type NewsImagePublic = {
  id: string
  news_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  order: number
  is_main: boolean
  created_at: string
}

// Get authorization headers from localStorage token
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Helper to construct full API URL with proper path handling
const getApiUrl = (path: string): string => {
  const base = OpenAPI.BASE || ""
  // If BASE already includes /api/v1, use it as is, otherwise add it
  if (base.includes("/api/v1")) {
    return `${base}${path.startsWith("/") ? path : `/${path}`}`
  }
  return `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`
}

// Temporary service wrapper - will be replaced with ImagesService from client after regeneration
export const ImagesService = {
  async uploadImage(newsId: string, file: File): Promise<NewsImagePublic> {
    // TODO: Replace with ImagesService.uploadImage({ newsId, file }) after client regeneration
    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post<NewsImagePublic>(
      getApiUrl(`/news/${newsId}/images/`),
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return response.data
  },

  async getImages(newsId: string): Promise<NewsImagePublic[]> {
    // TODO: Replace with ImagesService.getImages({ newsId }) after client regeneration
    const response = await axios.get<{ data: NewsImagePublic[]; count: number }>(
      getApiUrl(`/news/${newsId}/images/`),
      {
        headers: getAuthHeaders(),
      }
    )
    return response.data.data
  },

  async deleteImage(newsId: string, imageId: string): Promise<void> {
    // TODO: Replace with ImagesService.deleteImage({ newsId, imageId }) after client regeneration
    await axios.delete(getApiUrl(`/news/${newsId}/images/${imageId}`), {
      headers: getAuthHeaders(),
    })
  },

  async reorderImage(newsId: string, imageId: string, newOrder: number): Promise<NewsImagePublic> {
    // TODO: Replace with ImagesService.reorderImage({ newsId, imageId, newOrder }) after client regeneration
    const response = await axios.put<NewsImagePublic>(
      getApiUrl(`/news/${newsId}/images/${imageId}/reorder?new_order=${newOrder}`),
      {},
      {
        headers: getAuthHeaders(),
      }
    )
    return response.data
  },

  async setMainImage(newsId: string, imageId: string): Promise<NewsImagePublic> {
    // TODO: Replace with ImagesService.setMainImage({ newsId, imageId }) after client regeneration
    const response = await axios.put<NewsImagePublic>(
      getApiUrl(`/news/${newsId}/images/${imageId}/set-main`),
      {},
      {
        headers: getAuthHeaders(),
      }
    )
    return response.data
  },

  getImageUrl(newsId: string, imageId: string): string {
    // This is a static URL, not an API call - keep as is
    return getApiUrl(`/news/${newsId}/images/${imageId}/file`)
  },
}

