import { OpenAPI } from "@/client"

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const getApiUrl = (path: string): string => {
  const base = OpenAPI.BASE || ""
  return `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`
}

export interface DocumentCategory {
  id: string
  name: string
  created_at: string
}

export interface Document {
  id: string
  name: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  category_id: string
  category?: DocumentCategory
  owner_id: string
  owner?: {
    id: string
    email: string
    full_name: string | null
  }
  created_at: string
  updated_at: string
}

export interface DocumentsList {
  data: Document[]
  count: number
}

export interface DocumentCategoriesList {
  data: DocumentCategory[]
  count: number
}

export const DocumentsService = {
  async getCategories(): Promise<DocumentCategoriesList> {
    const response = await fetch(getApiUrl("/documents/categories"), {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch categories")
    }
    return response.json()
  },

  async createCategory(name: string): Promise<DocumentCategory> {
    const response = await fetch(getApiUrl("/documents/categories"), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create category")
    }
    return response.json()
  },

  async getDocuments(categoryId?: string, skip = 0, limit = 100): Promise<DocumentsList> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })
    if (categoryId) {
      params.append("category_id", categoryId)
    }
    const response = await fetch(getApiUrl(`/documents?${params}`), {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch documents")
    }
    return response.json()
  },

  async uploadDocument(
    file: File,
    name?: string,
    categoryId?: string,
    categoryName?: string
  ): Promise<Document> {
    const formData = new FormData()
    formData.append("file", file)
    if (name) {
      formData.append("name", name)
    }
    if (categoryId) {
      formData.append("category_id", categoryId)
    }
    if (categoryName) {
      formData.append("category_name", categoryName)
    }

    const response = await fetch(getApiUrl("/documents"), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to upload document")
    }
    return response.json()
  },

  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(getApiUrl(`/documents/${documentId}`), {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch document")
    }
    return response.json()
  },

  async updateDocument(
    documentId: string,
    data: { name?: string; category_id?: string | null }
  ): Promise<Document> {
    const response = await fetch(getApiUrl(`/documents/${documentId}`), {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to update document")
    }
    return response.json()
  },

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/documents/${documentId}`), {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to delete document")
    }
  },

  getDocumentFileUrl(documentId: string): string {
    return getApiUrl(`/documents/${documentId}/file`)
  },
}
