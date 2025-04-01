"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ExternalLink, RefreshCcw } from "lucide-react"
// Replace the import for useToast
import { toast } from "sonner"
import { useOrionData } from "@/components/orion-data-provider"

interface WireCloudDashboard {
  id: string
  name: string
  description: string
  lastModified: string
  url: string
}

export function WireCloudDashboard() {
  const [dashboards, setDashboards] = useState<WireCloudDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null)
  // Remove this line:
  // const { toast } = useToast()

  const WIRECLOUD_URL = process.env.NEXT_PUBLIC_WIRECLOUD_URL || "http://localhost:8000"

  const orionData = useOrionData()

  useEffect(() => {
    fetchDashboards()
  }, [])

  // Replace the fetchDashboards function with this implementation that uses real data from Orion

  const fetchDashboards = async () => {
    try {
      setLoading(true)

      // Fetch real dashboards from WireCloud API if available
      // For now, we'll create dashboard entries based on actual entity types in Orion
      const ORION_URL = process.env.NEXT_PUBLIC_ORION_URL || "http://localhost:1026"

      // Fetch entity types from Orion
      const response = await fetch(`${ORION_URL}/v2/types`, {
        headers: {
          "Fiware-Service": "warehouse",
          "Fiware-ServicePath": "/",
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching entity types: ${response.statusText}`)
      }

      const entityTypes = await response.json()

      // Create dashboards based on available entity types
      const realDashboards: WireCloudDashboard[] = []

      if (entityTypes.includes("Sensor") || entityTypes.includes("Device")) {
        realDashboards.push({
          id: "sensors-dashboard",
          name: "Sensor Monitoring",
          description: "Real-time data from all warehouse sensors",
          lastModified: new Date().toISOString(),
          url: `${WIRECLOUD_URL}/wirecloud/sensors-dashboard`,
        })
      }

      if (entityTypes.includes("InventoryItem")) {
        realDashboards.push({
          id: "inventory-dashboard",
          name: "Inventory Overview",
          description: "Real-time inventory levels and stock alerts",
          lastModified: new Date().toISOString(),
          url: `${WIRECLOUD_URL}/wirecloud/inventory-dashboard`,
        })
      }

      if (entityTypes.includes("WarehouseZone")) {
        realDashboards.push({
          id: "warehouse-dashboard",
          name: "Warehouse Zones",
          description: "Warehouse zone occupancy and capacity",
          lastModified: new Date().toISOString(),
          url: `${WIRECLOUD_URL}/wirecloud/warehouse-dashboard`,
        })
      }

      if (entityTypes.includes("Alert")) {
        realDashboards.push({
          id: "alerts-dashboard",
          name: "Alerts Dashboard",
          description: "Real-time alerts and notifications",
          lastModified: new Date().toISOString(),
          url: `${WIRECLOUD_URL}/wirecloud/alerts-dashboard`,
        })
      }

      // If no entity types were found, add a default dashboard
      if (realDashboards.length === 0) {
        realDashboards.push({
          id: "default-dashboard",
          name: "Warehouse Overview",
          description: "General warehouse monitoring dashboard",
          lastModified: new Date().toISOString(),
          url: `${WIRECLOUD_URL}/wirecloud/default-dashboard`,
        })
      }

      setDashboards(realDashboards)
      setSelectedDashboard(realDashboards[0].id)
      setError(null)
    } catch (err) {
      console.error("Error fetching WireCloud dashboards:", err)
      setError("Failed to load data from Orion Context Broker. Please ensure the IoT simulator is running.")
    } finally {
      setLoading(false)
    }
  }

  // Update the handleRefresh function:
  const handleRefresh = () => {
    fetchDashboards()
    toast.success("The list of available dashboards has been updated.", {
      description: "Dashboards refreshed",
    })
  }

  const handleOpenExternal = (url: string) => {
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">WireCloud Dashboards</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => handleOpenExternal(`${WIRECLOUD_URL}/wirecloud/`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open WireCloud
          </Button>
        </div>
      </div>

      <Tabs defaultValue={selectedDashboard || ""} onValueChange={setSelectedDashboard} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          {dashboards.map((dashboard) => (
            <TabsTrigger key={dashboard.id} value={dashboard.id}>
              {dashboard.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {dashboards.map((dashboard) => (
          <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{dashboard.name}</CardTitle>
                <CardDescription>{dashboard.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full border rounded-md overflow-hidden">
                  {/* In a real implementation, this would be an iframe to the actual WireCloud dashboard */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted">
                    <p className="mb-4">WireCloud dashboard would be embedded here in a production environment.</p>

                    {/* Show real data summary based on the dashboard type */}
                    <div className="w-full max-w-md mb-6 p-4 border rounded bg-card">
                      <h3 className="font-medium mb-2">Real-Time Data Summary:</h3>
                      {dashboard.id.includes("sensor") && (
                        <div className="text-sm text-left">
                          <p>• {orionData.sensors.length} active sensors</p>
                          <p>• Types: {Array.from(new Set(orionData.sensors.map((s) => s.sensorType))).join(", ")}</p>
                          <p>
                            • Locations:{" "}
                            {Array.from(new Set(orionData.sensors.map((s) => s.location)))
                              .slice(0, 3)
                              .join(", ")}
                            {orionData.sensors.length > 3 ? "..." : ""}
                          </p>
                        </div>
                      )}
                      {dashboard.id.includes("inventory") && (
                        <div className="text-sm text-left">
                          <p>• {orionData.inventory.length} inventory items</p>
                          <p>
                            • {orionData.inventory.filter((i) => i.quantity < i.threshold).length} items below threshold
                          </p>
                          <p>• Total quantity: {orionData.inventory.reduce((sum, item) => sum + item.quantity, 0)}</p>
                        </div>
                      )}
                      {dashboard.id.includes("warehouse") && (
                        <div className="text-sm text-left">
                          <p>• {orionData.zones.length} warehouse zones</p>
                          <p>• Total capacity: {orionData.zones.reduce((sum, zone) => sum + zone.capacity, 0)}</p>
                          <p>
                            • Current occupancy:{" "}
                            {Math.round(
                              (orionData.zones.reduce((sum, zone) => sum + zone.currentInventory, 0) /
                                orionData.zones.reduce((sum, zone) => sum + zone.capacity, 0)) *
                                100,
                            )}
                            %
                          </p>
                        </div>
                      )}
                      {dashboard.id.includes("alert") && (
                        <div className="text-sm text-left">
                          <p>• {orionData.alerts.length} alerts</p>
                          <p>• Critical: {orionData.alerts.filter((a) => a.severity === "critical").length}</p>
                          <p>• Warning: {orionData.alerts.filter((a) => a.severity === "warning").length}</p>
                        </div>
                      )}
                      {dashboard.id.includes("default") && (
                        <div className="text-sm text-left">
                          <p>
                            • {orionData.sensors.length} sensors, {orionData.inventory.length} inventory items
                          </p>
                          <p>
                            • {orionData.zones.length} warehouse zones, {orionData.alerts.length} alerts
                          </p>
                          <p>
                            • Last updated:{" "}
                            {orionData.lastUpdated ? new Date(orionData.lastUpdated).toLocaleTimeString() : "Never"}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button onClick={() => handleOpenExternal(dashboard.url)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in WireCloud
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

