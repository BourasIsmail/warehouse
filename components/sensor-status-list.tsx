"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ThermometerIcon,
  WeightIcon,
  ScanBarcodeIcon as BarcodeScannerIcon,
  WifiIcon,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSensors, type Sensor, type SensorType, subscribeToNotifications } from "@/lib/fiware-service"

export function SensorStatusList() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSensors = async () => {
      try {
        setLoading(true)
        const data = await fetchSensors()
        setSensors(data)
        setError(null)
      } catch (err) {
        console.error("Error loading sensors:", err)
        setError("Failed to load sensor data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadSensors()

    // Subscribe to real-time updates
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications("Sensor", (data) => {
          // Transform the data to match our Sensor interface
          const updatedSensors = data.map((entity: any) => {
            // Determine sensor status based on metadata or other attributes
            let status: "online" | "warning" | "offline" = "online"
            if (entity.batteryLevel?.value < 20) {
              status = "warning"
            } else if (entity.batteryLevel?.value < 5) {
              status = "offline"
            }

            // For temperature sensors, check if value is outside normal range
            if (
              entity.sensorType?.value === "temperature" &&
              (entity.temperature?.value > 26 || entity.temperature?.value < 0)
            ) {
              status = "warning"
            }

            // Format the value based on sensor type
            let formattedValue = ""
            switch (entity.sensorType?.value) {
              case "temperature":
                formattedValue = `${entity.temperature?.value.toFixed(1)}°C`
                break
              case "weight":
                formattedValue = `${entity.weight?.value} kg`
                break
              case "rfid":
                formattedValue = `${entity.scanRate?.value || 0} scans/min`
                break
              case "humidity":
                formattedValue = `${entity.humidity?.value.toFixed(1)}%`
                break
              default:
                formattedValue = "N/A"
            }

            return {
              id: entity.id,
              name: entity.name?.value || entity.id,
              type: entity.sensorType?.value as SensorType,
              location: entity.location?.value || "Unknown",
              status,
              lastReading: new Date(entity.dateModified?.value || Date.now()).toLocaleString(),
              value: formattedValue,
            }
          })

          setSensors(updatedSensors)
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

  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case "temperature":
        return <ThermometerIcon className="h-4 w-4" />
      case "weight":
        return <WeightIcon className="h-4 w-4" />
      case "rfid":
        return <BarcodeScannerIcon className="h-4 w-4" />
      case "humidity":
        return <WifiIcon className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: "online" | "warning" | "offline") => {
    switch (status) {
      case "online":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Online
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Offline
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sensor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Reading</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Sensor</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Reading</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sensors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No sensors found. Connect sensors to the FIWARE platform to see them here.
            </TableCell>
          </TableRow>
        ) : (
          sensors.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell className="font-medium">{sensor.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getSensorIcon(sensor.type)}
                  <span className="capitalize">{sensor.type}</span>
                </div>
              </TableCell>
              <TableCell>{sensor.location}</TableCell>
              <TableCell>{getStatusBadge(sensor.status)}</TableCell>
              <TableCell>{sensor.lastReading}</TableCell>
              <TableCell>{sensor.value}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

