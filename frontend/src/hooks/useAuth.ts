import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import {
  type Body_auth_login_access_token as AccessToken,
  AuthService,
  type UserPublic,
  type UserRegister,
  UsersService,
} from "@/client"
import { handleError } from "@/utils"
import useCustomToast from "./useCustomToast"

// Check if user is logged in by verifying token existence and expiration
const isLoggedIn = () => {
  const token = localStorage.getItem("access_token")
  if (!token) return false
  
  // Check token expiration
  const expiresAt = localStorage.getItem("token_expires_at")
  if (expiresAt) {
    const expires = parseInt(expiresAt, 10)
    if (Date.now() >= expires) {
      // Token expired, clear it
      localStorage.removeItem("access_token")
      localStorage.removeItem("token_expires_at")
      return false
    }
  }
  
  return true
}

// Authentication hook providing login, signup, logout, and current user state
const useAuth = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),
    onSuccess: () => {
      navigate({ to: "/auth/login" })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await AuthService.loginAccessToken({
      formData: data,
    })
    // Save token and expiration time (24 hours)
    localStorage.setItem("access_token", response.access_token)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    localStorage.setItem("token_expires_at", expiresAt.toString())
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/dashboard" })
    },
    onError: handleError.bind(showErrorToast),
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("token_expires_at")
    queryClient.clear() // Clear query cache
    navigate({ to: "/auth/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
  }
}

export { isLoggedIn }
export default useAuth
