"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowDown, ArrowUp, BoxIcon, ClipboardList, ExternalLink, TruckIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryLevelChart } from "@/components/inventory-level-chart"
import { RecentAlerts } from "@/components/recent-alerts"
import { WarehouseOccupancyChart } from "@/components/warehouse-occupancy-chart"
import { SensorStatusList } from "@/components/sensor-status-list"
import { fetchAlerts, fetchWarehouseZones, subscribeToNotifications } from "@/lib/fiware-service"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState({
    totalInventory: 0,
    pendingOrders: 0,
    outgoingShipments: 0,
    warehouseCapacity: 0,
    criticalAlert: null as { message: string; zone: string } | null,
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch warehouse zones to calculate total inventory and capacity
        const zones = await fetchWarehouseZones()
        const totalInventory = zones.reduce((sum, zone) => sum + zone.current, 0)
        const totalCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0)
        const warehouseCapacity = Math.round((totalInventory / totalCapacity) * 100)

        // Fetch alerts to check for critical alerts
        const alerts = await fetchAlerts()
        const criticalAlert = alerts.find((alert) => alert.severity === "critical") || null

        // In a real application, these would come from their own API endpoints
        // For now, we'll use placeholder values for orders and shipments
        const pendingOrders = 23
        const outgoingShipments = 18

        setDashboardData({
          totalInventory,
          pendingOrders,
          outgoingShipments,
          warehouseCapacity,
          criticalAlert: criticalAlert
            ? {
                message: criticalAlert.message,
                zone: criticalAlert.zone,
              }
            : null,
        })

        setError(null)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()

    // Subscribe to real-time updates for warehouse zones and alerts
    const unsubscribeZones = subscribeToNotifications("WarehouseZone", async () => {
      try {
        // When zone data changes, recalculate totals
        const zones = await fetchWarehouseZones()
        const totalInventory = zones.reduce((sum, zone) => sum + zone.current, 0)
        const totalCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0)
        const warehouseCapacity = Math.round((totalInventory / totalCapacity) * 100)

        setDashboardData((prev) => ({
          ...prev,
          totalInventory,
          warehouseCapacity,
        }))
      } catch (err) {
        console.error("Error updating dashboard data:", err)
      }
    })

    const unsubscribeAlerts = subscribeToNotifications("Alert", async () => {
      try {
        // When alerts change, check for critical alerts
        const alerts = await fetchAlerts()
        const criticalAlert = alerts.find((alert) => alert.severity === "critical") || null

        setDashboardData((prev) => ({
          ...prev,
          criticalAlert: criticalAlert
            ? {
                message: criticalAlert.message,
                zone: criticalAlert.zone,
              }
            : null,
        }))
      } catch (err) {
        console.error("Error updating alerts:", err)
      }
    })

    return () => {
      unsubscribeZones()
      unsubscribeAlerts()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <div className="ml-auto">
              <Skeleton className="h-9 w-[180px]" />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[120px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[80px]" />
                  <Skeleton className="h-4 w-[100px] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Skeleton className="h-[100px] w-full" />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-4 w-[250px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open WireCloud Dashboard
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <BoxIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalInventory.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  +2.5%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  +12%
                </span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outgoing Shipments</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.outgoingShipments}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <ArrowDown className="mr-1 h-4 w-4" />
                  -3%
                </span>{" "}
                from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouse Capacity</CardTitle>
              <Badge variant="outline">{dashboardData.warehouseCapacity}%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.warehouseCapacity}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${dashboardData.warehouseCapacity}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {dashboardData.criticalAlert && (
          <Alert variant="destructive" className="border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical Alert</AlertTitle>
            <AlertDescription>
              {dashboardData.criticalAlert.message} in {dashboardData.criticalAlert.zone}.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Inventory Levels</CardTitle>
                  <CardDescription>Real-time inventory levels across all warehouse zones</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <InventoryLevelChart />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Warehouse Occupancy</CardTitle>
                  <CardDescription>Current space utilization by zone</CardDescription>
                </CardHeader>
                <CardContent>
                  <WarehouseOccupancyChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="sensors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>IoT Sensor Status</CardTitle>
                <CardDescription>Real-time status of all warehouse sensors</CardDescription>
              </CardHeader>
              <CardContent>
                <SensorStatusList />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>System alerts from the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentAlerts />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

