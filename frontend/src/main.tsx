import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"

import { ApiError, OpenAPI } from "./client"
import { ThemeProvider } from "./providers/ThemeProvider"
import { Toaster } from "./components/ui/sonner"
import "./index.css"
import { routeTree } from "./routeTree.gen"

OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

// Global API error handler for query and mutation errors
const handleApiError = (error: Error) => {
  if (error instanceof ApiError) {
    // Handle authentication errors - clear token and redirect
    if ([401, 403].includes(error.status)) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("token_expires_at")
      // Use window.location for reliable redirect
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login"
      }
    }
    // Handle rate limiting errors
    if (error.status === 429) {
      console.error("Rate limit exceeded. Please wait before trying again.")
    }
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
