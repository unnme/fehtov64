import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { ApiError, client } from "./client"
import { Toaster } from "./components/ui/sonner"
import "./index.css"
import { ThemeProvider } from "./providers/ThemeProvider"
import { routeTree } from "./routeTree.gen"

// Configure client base URL and auth - OpenAPI.BASE is automatically updated
// Auth function reads from localStorage dynamically, so no need to update on every change
client.setConfig({
  baseURL: import.meta.env.VITE_API_URL || "",
  auth: async (auth) => {
    // Return token for bearer auth scheme
    if (auth.scheme === 'bearer') {
      return localStorage.getItem("access_token") || undefined
    }
    return undefined
  }
})

// Global API error handler for query and mutation errors
const handleApiError = (error: Error) => {
  // Check if it's an ApiError or AxiosError
  let status: number | undefined
  if (error instanceof ApiError) {
    status = error.status
  } else if ("response" in error && error.response) {
    status = (error.response as any)?.status
  }

  // Handle authentication errors - clear token and redirect
  if (status === 401 || status === 403) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("token_expires_at")
    // Update client config to remove auth
    client.setConfig({
      auth: async () => undefined
    })
    // Use window.location for reliable redirect
    if (window.location.pathname !== "/auth/login") {
      window.location.href = "/auth/login"
    }
  }
  // Handle rate limiting errors
  if (status === 429) {
    console.error("Rate limit exceeded. Please wait before trying again.")
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
