"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { fetchWarehouseZones, type WarehouseZone, subscribeToNotifications } from "@/lib/fiware-service"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import type { OrionWarehouseZone } from "@/lib/fiware-types"

export function InventoryLevelChart() {
  const [data, setData] = useState<WarehouseZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const zones = await fetchWarehouseZones()
        setData(zones)
        setError(null)
      } catch (err) {
        console.error("Error loading warehouse zones:", err)
        setError("Failed to load warehouse data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time updates
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications("WarehouseZone", (data: OrionWarehouseZone[]) => {
          // Transform the data to match our WarehouseZone interface
          const updatedZones = data.map((entity) => ({
            name: entity.name?.value || entity.id,
            current: entity.currentInventory?.value || 0,
            capacity: entity.capacity?.value || 1000,
          }))

          setData(updatedZones)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[350px] p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        <p className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No warehouse zone data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="current" name="Current Inventory" fill="#3b82f6" />
        <Bar dataKey="capacity" name="Total Capacity" fill="#94a3b8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

