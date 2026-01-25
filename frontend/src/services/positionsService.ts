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

export interface Position {
  id: string
  name: string
  created_at: string
}

export interface PositionsResponse {
  data: Position[]
  count: number
}

export interface PositionCreate {
  name: string
}

export interface PositionUpdate {
  name?: string
}

export const PositionsService = {
  async list(): Promise<PositionsResponse> {
    const response = await fetch(getApiUrl("/positions/"), {
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to fetch positions")
    }
    return response.json()
  },

  async create(data: PositionCreate): Promise<Position> {
    const response = await fetch(getApiUrl("/positions"), {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to create position")
    }
    return response.json()
  },

  async update(positionId: string, data: PositionUpdate): Promise<Position> {
    const response = await fetch(getApiUrl(`/positions/${positionId}`), {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to update position")
    }
    return response.json()
  },

  async delete(positionId: string): Promise<void> {
    const response = await fetch(getApiUrl(`/positions/${positionId}`), {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to delete position")
    }
  },
}
