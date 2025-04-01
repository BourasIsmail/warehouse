"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAlerts, type WarehouseAlert, subscribeToNotifications } from "@/lib/fiware-service"

export function RecentAlerts() {
  const [alerts, setAlerts] = useState<WarehouseAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true)
        const data = await fetchAlerts()
        // Sort alerts by timestamp, newest first
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setAlerts(data)
        setError(null)
      } catch (err) {
        console.error("Error loading alerts:", err)
        setError("Failed to load alert data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()

    // Subscribe to real-time updates
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications("Alert", (data) => {
          // Transform the data to match our WarehouseAlert interface
          const updatedAlerts = data.map((entity: any) => ({
            id: entity.id,
            timestamp: entity.timestamp || new Date().toISOString(),
            message: entity.message?.value || "Unknown alert",
            severity: entity.severity?.value || "info",
            zone: entity.zone?.value || "Unknown",
          }))

          // Sort alerts by timestamp, newest first
          updatedAlerts.sort(
            (a: WarehouseAlert, b: WarehouseAlert) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )

          setAlerts(updatedAlerts)
        })

        unsubscribeFunction = unsubscribe
      } catch (error) {
        console.error("Error setting up subscription:", error)
      }
    }

    setupSubscription()

    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction()
      }
    }
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getSeverityIcon = (severity: "critical" | "warning" | "info" | "resolved") => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
  }

  const getSeverityBadge = (severity: "critical" | "warning" | "info" | "resolved") => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Warning
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Info
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Resolved
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-[100px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[60px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
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

  if (alerts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No alerts found. Alerts will appear here when they are generated.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
          <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">{alert.zone}</div>
              <div className="flex items-center gap-2">
                {getSeverityBadge(alert.severity)}
                <span className="text-sm text-muted-foreground">{formatTime(alert.timestamp)}</span>
              </div>
            </div>
            <p className="text-sm">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

