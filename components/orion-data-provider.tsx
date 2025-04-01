"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Define types for our context
type OrionData = {
  sensors: any[]
  inventory: any[]
  zones: any[]
  alerts: any[]
  lastUpdated: Date | null
  loading: boolean
  error: string | null
}

// Create context with default values
const OrionDataContext = createContext<OrionData>({
  sensors: [],
  inventory: [],
  zones: [],
  alerts: [],
  lastUpdated: null,
  loading: true,
  error: null,
})

// Hook to use the context
export const useOrionData = () => useContext(OrionDataContext)

// Provider component
export function OrionDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OrionData>({
    sensors: [],
    inventory: [],
    zones: [],
    alerts: [],
    lastUpdated: null,
    loading: true,
    error: null,
  })

  const ORION_URL = process.env.NEXT_PUBLIC_ORION_URL || "http://localhost:1026"
  const FIWARE_SERVICE = "warehouse"
  const FIWARE_SERVICEPATH = "/"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sensors
        const sensorsResponse = await fetch(`${ORION_URL}/v2/entities?type=Sensor&options=keyValues`, {
          headers: {
            "FIWARE-Service": FIWARE_SERVICE,
            "FIWARE-ServicePath": FIWARE_SERVICEPATH,
          },
        })

        // Fetch inventory items
        const inventoryResponse = await fetch(`${ORION_URL}/v2/entities?type=InventoryItem&options=keyValues`, {
          headers: {
            "FIWARE-Service": FIWARE_SERVICE,
            "FIWARE-ServicePath": FIWARE_SERVICEPATH,
          },
        })

        // Fetch warehouse zones
        const zonesResponse = await fetch(`${ORION_URL}/v2/entities?type=WarehouseZone&options=keyValues`, {
          headers: {
            "FIWARE-Service": FIWARE_SERVICE,
            "FIWARE-ServicePath": FIWARE_SERVICEPATH,
          },
        })

        // Fetch alerts
        const alertsResponse = await fetch(`${ORION_URL}/v2/entities?type=Alert&options=keyValues`, {
          headers: {
            "FIWARE-Service": FIWARE_SERVICE,
            "FIWARE-ServicePath": FIWARE_SERVICEPATH,
          },
        })

        // Check if all responses are OK
        if (!sensorsResponse.ok || !inventoryResponse.ok || !zonesResponse.ok || !alertsResponse.ok) {
          throw new Error("Failed to fetch data from Orion Context Broker")
        }

        // Parse the responses
        const sensors = await sensorsResponse.json()
        const inventory = await inventoryResponse.json()
        const zones = await zonesResponse.json()
        const alerts = await alertsResponse.json()

        // Update state with the fetched data
        setData({
          sensors,
          inventory,
          zones,
          alerts,
          lastUpdated: new Date(),
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error fetching data from Orion:", error)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch data from Orion Context Broker. Make sure the IoT simulator is running.",
        }))
      }
    }

    // Fetch data immediately
    fetchData()

    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchData, 10000)

    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [ORION_URL])

  return <OrionDataContext.Provider value={data}>{children}</OrionDataContext.Provider>
}

