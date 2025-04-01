"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  logout: () => {},
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
      // Replace with your Keyrock authentication endpoint
      const response = await fetch("http://localhost:3005/v1/auth/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: email, password: password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || "Invalid credentials")
        return false
      }

      const data = await response.json()
      const newToken = data.token

      // Store token in local storage
      localStorage.setItem("keyrock_token", newToken)
      setToken(newToken)
      setError(null)
      return true
    } catch (err: any) {
      console.error("Login error:", err)
      setError("An unexpected error occurred during login.")
      return false
    }
  }

  const logout = () => {
    // Remove token from local storage
    localStorage.removeItem("keyrock_token")
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

