import { client } from "@/client"
import type { Position } from "@/services/positionsService"

function getApiUrl(path: string): string {
  const base = client.getConfig().baseURL || ""
  return `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export interface Person {
  id: string
  last_name: string
  first_name: string
  middle_name: string
  phone: string
  email: string
  description: string
  position: Position
  image?: PersonImage | null
  created_at: string
  updated_at: string
}

export interface PersonImage {
  id: string
  person_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface PersonsResponse {
  data: Person[]
  count: number
}

export interface PersonCreate {
  last_name: string
  first_name: string
  middle_name: string
  phone: string
  email: string
  description: string
  position_id: string
}

export interface PersonUpdate {
  last_name?: string
  first_name?: string
  middle_name?: string
  phone?: string
  email?: string
  description?: string
  position_id?: string
}

export const PersonsService = {
  async list(): Promise<PersonsResponse> {
    const response = await fetch(getApiUrl("/persons"), {
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to fetch persons")
    }
    return response.json()
  },

  async create(data: PersonCreate): Promise<Person> {
    const response = await fetch(getApiUrl("/persons"), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create person")
    }
    return response.json()
  },

  async update(personId: string, data: PersonUpdate): Promise<Person> {
    const response = await fetch(getApiUrl(`/persons/${personId}`), {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to update person")
    }
    return response.json()
  },

  async delete(personId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/persons/${personId}`), {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to delete person")
    }
  },

  async uploadImage(personId: string, file: File): Promise<PersonImage> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(getApiUrl(`/persons/${personId}/image`), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to upload image")
    }
    return response.json()
  },

  async deleteImage(personId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/persons/${personId}/image`), {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to delete image")
    }
  },
}
