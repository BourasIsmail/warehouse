"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useKeyrockAuth } from "@/components/keyrock-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Warehouse } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("admin@gmail.com")
  const [password, setPassword] = useState("admin")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { login, error, token } = useKeyrockAuth()
  const router = useRouter()

  // If token exists, redirect to home page
  useEffect(() => {
    if (token) {
      console.log("Token exists, redirecting to home page")
      router.push("/")
    }
  }, [token, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    try {
      console.log("Submitting login with:", email)
      const success = await login(email, password)
      console.log("Login result:", success)

      if (success) {
        console.log("Login successful, redirecting...")
        // Force navigation
        window.location.href = "/"
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Warehouse className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Smart Warehouse Management</CardTitle>
          <CardDescription className="text-center">Login to access your dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Default credentials: admin@gmail.com / admin</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

