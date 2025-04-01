"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Server, Settings, XCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getFiwareComponentStatuses } from "@/lib/fiware-service"

interface ComponentStatus {
  name: string
  endpoint: string
  status: boolean
  description: string
  metadata: Record<string, string | number>
}

export function FiwareIntegration() {
  const [components, setComponents] = useState<ComponentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkComponentStatuses = async () => {
      try {
        setLoading(true)
        const statuses = await getFiwareComponentStatuses()

        const componentList: ComponentStatus[] = [
          {
            name: "Orion Context Broker",
            endpoint: process.env.NEXT_PUBLIC_ORION_URL || "http://orion:1026/v2",
            status: statuses.orion,
            description: "FIWARE component for managing context information",
            metadata: {
              entities: 42,
              lastSync: "2 minutes ago",
            },
          },
          {
            name: "Keyrock Identity Management",
            endpoint: process.env.NEXT_PUBLIC_KEYROCK_URL || "http://keyrock:3005/v1",
            status: statuses.keyrock,
            description: "FIWARE component for authentication and authorization",
            metadata: {
              users: 15,
              lastSync: "5 minutes ago",
            },
          },
          {
            name: "WireCloud Dashboard",
            endpoint: process.env.NEXT_PUBLIC_WIRECLOUD_URL || "http://wirecloud:8000/api",
            status: statuses.wirecloud,
            description: "FIWARE component for creating mashup dashboards",
            metadata: {
              dashboards: 3,
              lastSync: "10 minutes ago",
            },
          },
          {
            name: "Knowage Analytics",
            endpoint: process.env.NEXT_PUBLIC_KNOWAGE_URL || "http://knowage:8080/api",
            status: statuses.knowage,
            description: "FIWARE component for business intelligence and analytics",
            metadata: {
              reports: 7,
              lastSync: "15 minutes ago",
            },
          },
        ]

        setComponents(componentList)
        setError(null)
      } catch (err) {
        console.error("Error checking component statuses:", err)
        setError("Failed to check FIWARE component statuses. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    checkComponentStatuses()

    // Periodically check component statuses
    const interval = setInterval(checkComponentStatuses, 60000) // Check every minute

    return () => {
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-6 w-[100px]" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        <p className="flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {components.map((component) => (
        <Card key={component.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {component.name}
            </CardTitle>
            <CardDescription>{component.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {component.status ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endpoint</span>
                <span className="text-sm text-muted-foreground">{component.endpoint}</span>
              </div>
              {Object.entries(component.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="text-sm text-muted-foreground">{value}</span>
                </div>
              ))}
              <Button
                variant={
                  component.name.includes("WireCloud") || component.name.includes("Knowage") ? "default" : "outline"
                }
                className="w-full"
                disabled={!component.status}
              >
                {component.name.includes("WireCloud") || component.name.includes("Knowage") ? (
                  `Open ${component.name.split(" ")[0]}`
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

