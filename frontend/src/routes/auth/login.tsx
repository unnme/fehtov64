import { useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Body_auth_login_access_token as AccessToken } from "@/client"
import { OpenAPI, UsersService } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { getCachedClientIP } from "@/utils/getClientIP"

const formSchema = z.object({
  username: z.email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

// Login page route with token validation
export const Route = createFileRoute("/auth/login")({
  component: Login,
  beforeLoad: async () => {
    // Validate token existence and authenticity
    if (isLoggedIn()) {
      try {
        await UsersService.readUserMe()
        // Redirect to dashboard if token is valid
        throw redirect({
          to: "/dashboard",
        })
      } catch (error: any) {
        // Clear invalid token and allow login attempt
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("token_expires_at")
        }
      }
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - FastAPI Cloud",
      },
    ],
  }),
})

// Login form component with honeypot bot protection
function Login() {
  const { loginMutation } = useAuth()
  const honeypotRef = useRef<HTMLInputElement>(null)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  // Collect client IP on page load for rate limiting
  useEffect(() => {
    getCachedClientIP().catch(() => {
      // Ignore IP collection errors
    })
  }, [])

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    
    // Check honeypot - if filled, it's a bot
    if (honeypotRef.current?.value) {
      // Block bot via honeypot endpoint - middleware will block IP automatically
      fetch(`${OpenAPI.BASE}/api/v1/auth/honeypot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(() => {
        // Ignore errors - request sent, middleware will block IP
      })
      // Prevent further login attempt for bots
      return
    }
    
    loginMutation.mutate(data)
  }


  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      placeholder="user@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <RouterLink
                      to="/auth/recover-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </RouterLink>
                  </div>
                  <FormControl>
                    <PasswordInput
                      data-testid="password-input"
                      placeholder="Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Honeypot field - hidden from users but bots may fill it */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              autoComplete="off"
              tabIndex={-1}
              style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />

            <LoadingButton type="submit" loading={loginMutation.isPending}>
              Log In
            </LoadingButton>
          </div>

          <div className="text-center text-sm">
            Don't have an account yet?{" "}
            <RouterLink to="/auth/signup" className="underline underline-offset-4">
              Sign up
            </RouterLink>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}

