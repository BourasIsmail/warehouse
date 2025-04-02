"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setCookie, deleteCookie } from "cookies-next"
import axios from "axios"

// Define types for our context
type AuthContextType = {
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  error: string | null
}

// Create context with default values
const KeyrockAuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => false,
  logout: () => { },
  error: null,
})

// Hook to use the context
export const useKeyrockAuth = () => useContext(KeyrockAuthContext)

// Provider component
export function KeyrockAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for token in local storage on mount
    const storedToken = localStorage.getItem("keyrock_token")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with:", email)

      // Direct request to Keyrock using axios
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_KEYROCK_URL || "http://localhost:3005"}/v1/auth/tokens`,
        {
          name: email,
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
          transformResponse: (res, headers) => {
            console.log("Raw Headers:", headers);
            return res;
          }
        },
      )

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers.toJSON)

      // Important: Keyrock returns the token in the X-Subject-Token header
      const newToken = response.headers["x-subject-token"]
      console.log("New token:", newToken)
      for (const [key, value] of Object.entries(response.headers)) {
        console.log(`${key}: ${value}`);
      }
      const token = response.headers["x-subject-token"];
      console.log("X-Subject-Token:", token);

      const headers = response.headers;
      console.log(headers);
      console.log(headers["x-subject-token"] || headers["X-Subject-Token"]);
      if (!newToken) {
        console.error("Login failed: No token in response")
        setError("Invalid credentials")
        return false
      }
      console.log(response.headers.entre)

      console.log("Token received:", newToken)

      // Store token in both localStorage and cookies
      localStorage.setItem("keyrock_token", newToken)
      // Set cookie with path / so it's available to the middleware
      setCookie("keyrock_token", newToken, { path: "/" })

      setToken(newToken)
      setError(null)

      // Get user info using the token
      await fetchUserInfo(newToken)

      // Force navigation after a short delay to ensure state is updated
      setTimeout(() => {
        console.log("Navigating to home page...")
        router.push("/")
      }, 100)

      return true
    } catch (err) {
      console.error("Login error:", err)

      // Axios provides better error handling
      if (axios.isAxiosError(err)) {
        console.error("Response data:", err.response?.data)
        console.error("Response status:", err.response?.status)
        setError(err.response?.data?.error || "Invalid credentials")
      } else {
        setError("An unexpected error occurred during login.")
      }

      return false
    }
  }

  const fetchUserInfo = async (authToken: string) => {
    try {
      // Use the token to get user information
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_KEYROCK_URL || "http://localhost:3005"}/v1/auth/tokens`,
        {
          headers: {
            "X-Auth-Token": authToken,
            "X-Subject-Token": authToken,
          },
        },
      )

      console.log("User data retrieved:", response.data)
      // You can store user data in state or localStorage if needed
    } catch (error) {
      console.error("Error fetching user info:", error)
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data)
      }
    }
  }

  const logout = () => {
    // If we have a token, try to revoke it
    if (token) {
      axios
        .delete(`${process.env.NEXT_PUBLIC_KEYROCK_URL || "http://localhost:3005"}/v1/auth/tokens`, {
          headers: {
            "X-Auth-Token": token,
            "X-Subject-Token": token,
          },
        })
        .catch((err) => console.error("Error during logout:", err))
    }

    // Remove token from both localStorage and cookies
    localStorage.removeItem("keyrock_token")
    deleteCookie("keyrock_token")

    setToken(null)
    router.push("/login")
  }

  const value = {
    token,
    login,
    logout,
    error,
  }

  return <KeyrockAuthContext.Provider value={value}>{children}</KeyrockAuthContext.Provider>
}

