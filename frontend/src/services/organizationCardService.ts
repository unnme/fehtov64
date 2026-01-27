import { client } from "@/client"

function getApiUrl(path: string): string {
  const base = client.getConfig().baseURL || ""
  return `${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export interface PhoneWithDescription {
  phone: string
  description?: string | null
}

export interface OrganizationCard {
  id: string
  name: string
  phones: PhoneWithDescription[] | string[] // Legacy format support (strings)
  email: string
  address: string
  work_hours: string
  vk_url?: string | null
  telegram_url?: string | null
  whatsapp_url?: string | null
  max_url?: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
  updated_at: string
}

export interface OrganizationCardCreate {
  name: string
  phones: PhoneWithDescription[]
  email: string
  address: string
  work_hours: string
  vk_url?: string | null
  telegram_url?: string | null
  whatsapp_url?: string | null
  max_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type OrganizationCardUpdate = Partial<OrganizationCardCreate>

export const OrganizationCardService = {
  async readPublic(): Promise<OrganizationCard> {
    const response = await fetch(getApiUrl("/organization-card/public"))
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || "Failed to load organization card")
    }
    const data = await response.json()
    if (data.phones && data.phones.length > 0 && typeof data.phones[0] === 'string') {
      data.phones = data.phones.map((phone: string) => ({ phone, description: null }))
    }
    return data
  },
  async read(): Promise<OrganizationCard> {
    const response = await fetch(getApiUrl("/organization-card/"), {
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || "Failed to load organization card")
    }
    const data = await response.json()
    if (data.phones && data.phones.length > 0 && typeof data.phones[0] === 'string') {
      data.phones = data.phones.map((phone: string) => ({ phone, description: null }))
    }
    return data
  },
  async create(data: OrganizationCardCreate): Promise<OrganizationCard> {
    const response = await fetch(getApiUrl("/organization-card/"), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || "Failed to create organization card")
    }
    return response.json()
  },
  async update(data: OrganizationCardUpdate): Promise<OrganizationCard> {
    const response = await fetch(getApiUrl("/organization-card/"), {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || "Failed to update organization card")
    }
    return response.json()
  },
}
