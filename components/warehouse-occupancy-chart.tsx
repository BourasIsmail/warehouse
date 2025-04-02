"use client"

import { useEffect, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { fetchWarehouseOccupancy, type WarehouseOccupancy, subscribeToNotifications } from "@/lib/fiware-service"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

// Define the OrionWarehouseZone interface
interface OrionWarehouseZone {
  id: string
  name?: {
    value: string
  }
  currentInventory?: {
    value: number
  }
  capacity?: {
    value: number
  }
}

export function WarehouseOccupancyChart() {
  const [data, setData] = useState<WarehouseOccupancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const occupancy = await fetchWarehouseOccupancy()
        setData(occupancy)
        setError(null)
      } catch (err) {
        console.error("Error loading warehouse occupancy:", err)
        setError("Failed to load occupancy data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time updates for warehouse zones
    // When zones change, we need to recalculate occupancy
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications<OrionWarehouseZone>("WarehouseZone", async () => {
          try {
            // When zone data changes, fetch the updated occupancy
            const occupancy = await fetchWarehouseOccupancy()
            setData(occupancy)
          } catch (err) {
            console.error("Error updating warehouse occupancy:", err)
          }
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
      <div className="flex items-center justify-center h-[300px]">
        <Skeleton className="h-[250px] w-[250px] rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        <p className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No warehouse occupancy data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

