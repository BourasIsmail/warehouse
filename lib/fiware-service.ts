// FIWARE API service for interacting with Orion Context Broker
import type {
  OrionSensor,
  OrionInventoryItem,
  OrionWarehouseZone,
  OrionShipment,
  OrionOrder,
  OrionReport,
  OrionUser,
  OrionSystemSetting,
} from "./fiware-types"

// Base URL for Orion Context Broker
const ORION_BASE_URL = process.env.NEXT_PUBLIC_ORION_URL || "http://localhost:1026"
// Base URL for Keyrock Identity Management
const KEYROCK_BASE_URL = process.env.NEXT_PUBLIC_KEYROCK_URL || "http://localhost:3005"
// Base URL for WireCloud
const WIRECLOUD_BASE_URL = process.env.NEXT_PUBLIC_WIRECLOUD_URL || "http://localhost:8000"
// Base URL for Knowage
const KNOWAGE_BASE_URL = process.env.NEXT_PUBLIC_KNOWAGE_URL || "http://localhost:8080"

// FIWARE Service and ServicePath headers
const FIWARE_SERVICE = "warehouse"
const FIWARE_SERVICEPATH = "/"

// Common headers for Orion requests
const orionHeaders = {
  "Content-Type": "application/json",
  "Fiware-Service": FIWARE_SERVICE,
  "Fiware-ServicePath": FIWARE_SERVICEPATH,
}

// Types for sensor data
export type SensorStatus = "online" | "warning" | "offline"
export type SensorType = "temperature" | "weight" | "rfid" | "humidity"

export interface Sensor {
  id: string
  name: string
  type: SensorType
  location: string
  status: SensorStatus
  lastReading: string
  value: string
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  location: string
  status: "In Stock" | "Low Stock" | "Out of Stock"
  lastUpdated: string
  threshold?: number
}

export interface WarehouseZone {
  name: string
  current: number
  capacity: number
  currentInventory?: number // Add this property
}

export interface WarehouseOccupancy {
  name: string
  value: number
  color: string
}

export interface WarehouseAlert {
  id: string
  timestamp: string
  message: string
  severity: "critical" | "warning" | "info" | "resolved"
  zone: string
}

// New interfaces for additional pages
export interface Shipment {
  id: string
  shipmentId: string
  status: "Pending" | "In Transit" | "Delivered" | "Cancelled"
  origin: string
  destination: string
  carrier: string
  trackingNumber: string
  items: ShipmentItem[]
  scheduledDate: string
  actualDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ShipmentItem {
  id: string
  productId: string
  productName: string
  quantity: number
  sku: string
}

export interface Order {
  id: string
  orderId: string
  customer: string
  status: "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  items: OrderItem[]
  totalAmount: number
  paymentStatus: "Pending" | "Paid" | "Refunded"
  orderDate: string
  shipByDate: string
  priority: "Low" | "Normal" | "High" | "Urgent"
  notes: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  sku: string
}

export interface Report {
  id: string
  name: string
  description: string
  type: "Inventory" | "Orders" | "Shipments" | "Performance" | "Custom"
  createdBy: string
  createdAt: string
  lastRun: string | null
  schedule: "Daily" | "Weekly" | "Monthly" | "On Demand"
  format: "PDF" | "CSV" | "Excel" | "Dashboard"
  url: string
}

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "Admin" | "Manager" | "Operator" | "Viewer"
  department: string
  lastLogin: string | null
  status: "Active" | "Inactive" | "Locked"
  createdAt: string
}

export interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  description: string
  updatedBy: string
  updatedAt: string
}

// Fetch all sensors from Orion Context Broker
export async function fetchSensors(): Promise<Sensor[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=Sensor`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching sensors: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionSensor[]

    // Transform Orion data to our Sensor interface
    return data.map((entity) => {
      // Determine sensor status based on metadata or other attributes
      let status: SensorStatus = "online"
      const batteryLevel = entity.batteryLevel?.value ?? 100
      if (batteryLevel < 20) {
        status = "warning"
      } else if (batteryLevel < 5) {
        status = "offline"
      }

      // For temperature sensors, check if value is outside normal range
      if (
        entity.sensorType?.value === "temperature" &&
        entity.temperature?.value !== undefined &&
        (entity.temperature.value > 26 || entity.temperature.value < 0)
      ) {
        status = "warning"
      }

      // Format the value based on sensor type
      let formattedValue = ""
      switch (entity.sensorType?.value) {
        case "temperature":
          formattedValue = `${entity.temperature?.value?.toFixed(1) ?? "N/A"}°C`
          break
        case "weight":
          formattedValue = `${entity.weight?.value ?? "N/A"} kg`
          break
        case "rfid":
          formattedValue = `${entity.scanRate?.value ?? 0} scans/min`
          break
        case "humidity":
          formattedValue = `${entity.humidity?.value?.toFixed(1) ?? "N/A"}%`
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
  } catch (error) {
    console.error("Failed to fetch sensors:", error)
    return []
  }
}

// Fetch inventory items from Orion Context Broker
export async function fetchInventory(): Promise<InventoryItem[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=InventoryItem`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching inventory: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionInventoryItem[]

    // Transform Orion data to our InventoryItem interface
    return data.map((entity) => {
      // Determine inventory status based on quantity and threshold
      let status: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock"
      const quantity = entity.quantity?.value || 0
      const threshold = entity.threshold?.value || 50

      if (quantity === 0) {
        status = "Out of Stock"
      } else if (quantity < threshold) {
        status = "Low Stock"
      }

      return {
        id: entity.id,
        sku: entity.sku?.value || "Unknown",
        name: entity.name?.value || "Unknown Product",
        quantity,
        threshold,
        location: entity.location?.value || "Unknown",
        status,
        lastUpdated: new Date(entity.dateModified?.value || Date.now()).toLocaleString(),
      }
    })
  } catch (error) {
    console.error("Failed to fetch inventory:", error)
    return []
  }
}

// Fetch warehouse zones data for inventory levels chart
export async function fetchWarehouseZones(): Promise<WarehouseZone[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=WarehouseZone`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching warehouse zones: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionWarehouseZone[]

    // Transform Orion data to our WarehouseZone interface
    return data.map((entity) => ({
      name: entity.name?.value || entity.id,
      current: entity.currentInventory?.value || 0,
      capacity: entity.capacity?.value || 1000,
      currentInventory: entity.currentInventory?.value || 0, // Add this line
    }))
  } catch (error) {
    console.error("Failed to fetch warehouse zones:", error)
    return []
  }
}

// Fetch warehouse occupancy data for pie chart
export async function fetchWarehouseOccupancy(): Promise<WarehouseOccupancy[]> {
  try {
    const zones = await fetchWarehouseZones()

    // Define colors for each zone
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

    // Calculate occupancy percentage for each zone
    return zones.map((zone, index) => ({
      name: zone.name,
      value: Math.round((zone.current / zone.capacity) * 100),
      color: colors[index % colors.length],
    }))
  } catch (error) {
    console.error("Failed to fetch warehouse occupancy:", error)
    return []
  }
}

// Fetch alerts from Orion Context Broker
export async function fetchAlerts(): Promise<WarehouseAlert[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=Alert&options=keyValues`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching alerts: ${response.statusText}`)
    }

    const data = (await response.json()) as Record<string, string>[]

    // Transform Orion data to our WarehouseAlert interface
    return data.map((entity) => ({
      id: entity.id,
      timestamp: entity.timestamp || new Date().toISOString(),
      message: entity.message || "Unknown alert",
      severity: (entity.severity || "info") as "critical" | "warning" | "info" | "resolved",
      zone: entity.zone || "Unknown",
    }))
  } catch (error) {
    console.error("Failed to fetch alerts:", error)
    return []
  }
}

// Fetch shipments from Orion Context Broker
export async function fetchShipments(): Promise<Shipment[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=Shipment`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching shipments: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionShipment[]

    // Transform Orion data to our Shipment interface
    return data.map((entity) => {
      // Parse items from JSON string if needed
      let items: ShipmentItem[] = []
      try {
        if (entity.items?.value) {
          if (typeof entity.items.value === "string") {
            items = JSON.parse(entity.items.value as string)
          } else if (Array.isArray(entity.items.value)) {
            items = entity.items.value as ShipmentItem[]
          }
        }
      } catch (e) {
        console.error("Error parsing shipment items:", e)
      }

      return {
        id: entity.id,
        shipmentId: entity.shipmentId?.value || entity.id,
        status: (entity.status?.value || "Pending") as "Pending" | "In Transit" | "Delivered" | "Cancelled",
        origin: entity.origin?.value || "Unknown",
        destination: entity.destination?.value || "Unknown",
        carrier: entity.carrier?.value || "Unknown",
        trackingNumber: entity.trackingNumber?.value || "N/A",
        items,
        scheduledDate: entity.scheduledDate?.value || new Date().toISOString(),
        actualDate: entity.actualDate?.value || null,
        createdAt: entity.dateCreated?.value || new Date().toISOString(),
        updatedAt: entity.dateModified?.value || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error("Failed to fetch shipments:", error)
    return []
  }
}

// Create a new shipment in Orion
export async function createShipment(shipment: Partial<Shipment>): Promise<string> {
  try {
    // Format the shipment data for Orion
    const orionShipment = {
      id: `Shipment:${Date.now()}`,
      type: "Shipment",
      shipmentId: {
        type: "Text",
        value: shipment.shipmentId || `SHP-${Date.now().toString().slice(-6)}`,
      },
      status: {
        type: "Text",
        value: shipment.status || "Pending",
      },
      origin: {
        type: "Text",
        value: shipment.origin || "Warehouse",
      },
      destination: {
        type: "Text",
        value: shipment.destination,
      },
      carrier: {
        type: "Text",
        value: shipment.carrier,
      },
      trackingNumber: {
        type: "Text",
        value: shipment.trackingNumber || "N/A",
      },
      items: {
        type: "StructuredValue",
        value: shipment.items || [],
      },
      scheduledDate: {
        type: "DateTime",
        value: shipment.scheduledDate || new Date().toISOString(),
      },
      actualDate: {
        type: "DateTime",
        value: shipment.actualDate || null,
      },
      dateCreated: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
      dateModified: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
    }

    // Create the shipment in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities`, {
      method: "POST",
      headers: orionHeaders,
      body: JSON.stringify(orionShipment),
    })

    if (!response.ok) {
      throw new Error(`Error creating shipment: ${response.statusText}`)
    }

    return orionShipment.id
  } catch (error) {
    console.error("Failed to create shipment:", error)
    throw error
  }
}

// Update a shipment in Orion
export async function updateShipment(id: string, updates: Partial<Shipment>): Promise<boolean> {
  try {
    // Format the updates for Orion
    const orionUpdates: Record<string, unknown> = {}

    if (updates.status !== undefined) {
      orionUpdates.status = {
        type: "Text",
        value: updates.status,
      }
    }

    if (updates.trackingNumber !== undefined) {
      orionUpdates.trackingNumber = {
        type: "Text",
        value: updates.trackingNumber,
      }
    }

    if (updates.actualDate !== undefined) {
      orionUpdates.actualDate = {
        type: "DateTime",
        value: updates.actualDate,
      }
    }

    if (updates.items !== undefined) {
      orionUpdates.items = {
        type: "StructuredValue",
        value: updates.items,
      }
    }

    // Always update the modification date
    orionUpdates.dateModified = {
      type: "DateTime",
      value: new Date().toISOString(),
    }

    // Update the shipment in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities/${id}/attrs`, {
      method: "PATCH",
      headers: orionHeaders,
      body: JSON.stringify(orionUpdates),
    })

    if (!response.ok) {
      throw new Error(`Error updating shipment: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to update shipment:", error)
    throw error
  }
}

// Fetch orders from Orion Context Broker
export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=Order`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching orders: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionOrder[]

    // Transform Orion data to our Order interface
    return data.map((entity) => {
      // Parse items from JSON string if needed
      let items: OrderItem[] = []
      try {
        if (entity.items?.value) {
          if (typeof entity.items.value === "string") {
            items = JSON.parse(entity.items.value as string)
          } else if (Array.isArray(entity.items.value)) {
            items = entity.items.value as OrderItem[]
          }
        }
      } catch (e) {
        console.error("Error parsing order items:", e)
      }

      return {
        id: entity.id,
        orderId: entity.orderId?.value || entity.id,
        customer: entity.customer?.value || "Unknown",
        status: (entity.status?.value || "New") as "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled",
        items,
        totalAmount: entity.totalAmount?.value || 0,
        paymentStatus: (entity.paymentStatus?.value || "Pending") as "Pending" | "Paid" | "Refunded",
        orderDate: entity.orderDate?.value || new Date().toISOString(),
        shipByDate: entity.shipByDate?.value || new Date().toISOString(),
        priority: (entity.priority?.value || "Normal") as "Low" | "Normal" | "High" | "Urgent",
        notes: entity.notes?.value || "",
      }
    })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return []
  }
}

// Create a new order in Orion
export async function createOrder(order: Partial<Order>): Promise<string> {
  try {
    // Calculate total amount if not provided
    let totalAmount = order.totalAmount || 0
    if (!totalAmount && order.items && order.items.length > 0) {
      totalAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }

    // Format the order data for Orion
    const orionOrder = {
      id: `Order:${Date.now()}`,
      type: "Order",
      orderId: {
        type: "Text",
        value: order.orderId || `ORD-${Date.now().toString().slice(-6)}`,
      },
      customer: {
        type: "Text",
        value: order.customer || "Unknown",
      },
      status: {
        type: "Text",
        value: order.status || "New",
      },
      items: {
        type: "StructuredValue",
        value: order.items || [],
      },
      totalAmount: {
        type: "Number",
        value: totalAmount,
      },
      paymentStatus: {
        type: "Text",
        value: order.paymentStatus || "Pending",
      },
      orderDate: {
        type: "DateTime",
        value: order.orderDate || new Date().toISOString(),
      },
      shipByDate: {
        type: "DateTime",
        value: order.shipByDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      priority: {
        type: "Text",
        value: order.priority || "Normal",
      },
      notes: {
        type: "Text",
        value: order.notes || "",
      },
      dateCreated: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
      dateModified: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
    }

    // Create the order in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities`, {
      method: "POST",
      headers: orionHeaders,
      body: JSON.stringify(orionOrder),
    })

    if (!response.ok) {
      throw new Error(`Error creating order: ${response.statusText}`)
    }

    return orionOrder.id
  } catch (error) {
    console.error("Failed to create order:", error)
    throw error
  }
}

// Update an order in Orion
export async function updateOrder(id: string, updates: Partial<Order>): Promise<boolean> {
  try {
    // Format the updates for Orion
    const orionUpdates: Record<string, unknown> = {}

    if (updates.status !== undefined) {
      orionUpdates.status = {
        type: "Text",
        value: updates.status,
      }
    }

    if (updates.paymentStatus !== undefined) {
      orionUpdates.paymentStatus = {
        type: "Text",
        value: updates.paymentStatus,
      }
    }

    if (updates.items !== undefined) {
      orionUpdates.items = {
        type: "StructuredValue",
        value: updates.items,
      }

      // Recalculate total amount if items change
      const totalAmount = updates.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      orionUpdates.totalAmount = {
        type: "Number",
        value: totalAmount,
      }
    } else if (updates.totalAmount !== undefined) {
      orionUpdates.totalAmount = {
        type: "Number",
        value: updates.totalAmount,
      }
    }

    if (updates.priority !== undefined) {
      orionUpdates.priority = {
        type: "Text",
        value: updates.priority,
      }
    }

    if (updates.notes !== undefined) {
      orionUpdates.notes = {
        type: "Text",
        value: updates.notes,
      }
    }

    if (updates.shipByDate !== undefined) {
      orionUpdates.shipByDate = {
        type: "DateTime",
        value: updates.shipByDate,
      }
    }

    // Always update the modification date
    orionUpdates.dateModified = {
      type: "DateTime",
      value: new Date().toISOString(),
    }

    // Update the order in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities/${id}/attrs`, {
      method: "PATCH",
      headers: orionHeaders,
      body: JSON.stringify(orionUpdates),
    })

    if (!response.ok) {
      throw new Error(`Error updating order: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to update order:", error)
    throw error
  }
}

// Fetch reports from Orion Context Broker
export async function fetchReports(): Promise<Report[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=Report`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching reports: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionReport[]

    // Transform Orion data to our Report interface
    return data.map((entity) => ({
      id: entity.id,
      name: entity.name?.value || "Unnamed Report",
      description: entity.description?.value || "",
      type: (entity.reportType?.value || "Custom") as "Inventory" | "Orders" | "Shipments" | "Performance" | "Custom",
      createdBy: entity.createdBy?.value || "System",
      createdAt: entity.dateCreated?.value || new Date().toISOString(),
      lastRun: entity.lastRun?.value || null,
      schedule: (entity.schedule?.value || "On Demand") as "Daily" | "Weekly" | "Monthly" | "On Demand",
      format: (entity.format?.value || "PDF") as "PDF" | "CSV" | "Excel" | "Dashboard",
      url: entity.url?.value || "#",
    }))
  } catch (error) {
    console.error("Failed to fetch reports:", error)
    return []
  }
}

// Create a new report in Orion
export async function createReport(report: Partial<Report>): Promise<string> {
  try {
    // Format the report data for Orion
    const orionReport = {
      id: `Report:${Date.now()}`,
      type: "Report",
      name: {
        type: "Text",
        value: report.name || "New Report",
      },
      description: {
        type: "Text",
        value: report.description || "",
      },
      reportType: {
        type: "Text",
        value: report.type || "Custom",
      },
      createdBy: {
        type: "Text",
        value: report.createdBy || "System",
      },
      dateCreated: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
      lastRun: {
        type: "DateTime",
        value: report.lastRun || null,
      },
      schedule: {
        type: "Text",
        value: report.schedule || "On Demand",
      },
      format: {
        type: "Text",
        value: report.format || "PDF",
      },
      url: {
        type: "Text",
        value: report.url || "#",
      },
    }

    // Create the report in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities`, {
      method: "POST",
      headers: orionHeaders,
      body: JSON.stringify(orionReport),
    })

    if (!response.ok) {
      throw new Error(`Error creating report: ${response.statusText}`)
    }

    return orionReport.id
  } catch (error) {
    console.error("Failed to create report:", error)
    throw error
  }
}

// Fetch users from Keyrock Identity Management
export async function fetchUsers(): Promise<User[]> {
  try {
    // In a real application, this would use the Keyrock API
    // For now, we'll simulate a fetch from Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=User`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionUser[]

    // Transform Orion data to our User interface
    return data.map((entity) => ({
      id: entity.id,
      username: entity.username?.value || "user",
      email: entity.email?.value || "user@example.com",
      firstName: entity.firstName?.value || "Unknown",
      lastName: entity.lastName?.value || "User",
      role: (entity.role?.value || "Viewer") as "Admin" | "Manager" | "Operator" | "Viewer",
      department: entity.department?.value || "General",
      lastLogin: entity.lastLogin?.value || null,
      status: (entity.status?.value || "Active") as "Active" | "Inactive" | "Locked",
      createdAt: entity.dateCreated?.value || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return []
  }
}

// Create a new user in Keyrock
export async function createUser(user: Partial<User>): Promise<string> {
  try {
    // In a real application, this would use the Keyrock API
    // For now, we'll simulate a create in Orion
    const orionUser = {
      id: `User:${Date.now()}`,
      type: "User",
      username: {
        type: "Text",
        value: user.username || `user_${Date.now().toString().slice(-6)}`,
      },
      email: {
        type: "Text",
        value: user.email || `user_${Date.now().toString().slice(-6)}@example.com`,
      },
      firstName: {
        type: "Text",
        value: user.firstName || "New",
      },
      lastName: {
        type: "Text",
        value: user.lastName || "User",
      },
      role: {
        type: "Text",
        value: user.role || "Viewer",
      },
      department: {
        type: "Text",
        value: user.department || "General",
      },
      lastLogin: {
        type: "DateTime",
        value: null,
      },
      status: {
        type: "Text",
        value: "Active",
      },
      dateCreated: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
    }

    // Create the user in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities`, {
      method: "POST",
      headers: orionHeaders,
      body: JSON.stringify(orionUser),
    })

    if (!response.ok) {
      throw new Error(`Error creating user: ${response.statusText}`)
    }

    return orionUser.id
  } catch (error) {
    console.error("Failed to create user:", error)
    throw error
  }
}

// Fetch system settings from Orion Context Broker
export async function fetchSystemSettings(): Promise<SystemSetting[]> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=SystemSetting`, {
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error fetching system settings: ${response.statusText}`)
    }

    const data = (await response.json()) as OrionSystemSetting[]

    // Transform Orion data to our SystemSetting interface
    return data.map((entity) => ({
      id: entity.id,
      category: entity.category?.value || "General",
      key: entity.key?.value || "unknown",
      value: entity.value?.value || "",
      description: entity.description?.value || "",
      updatedBy: entity.updatedBy?.value || "System",
      updatedAt: entity.dateModified?.value || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Failed to fetch system settings:", error)
    return []
  }
}

// Update a system setting in Orion
export async function updateSystemSetting(id: string, value: string, updatedBy = "System"): Promise<boolean> {
  try {
    // Format the updates for Orion
    const orionUpdates = {
      value: {
        type: "Text",
        value: value,
      },
      updatedBy: {
        type: "Text",
        value: updatedBy,
      },
      dateModified: {
        type: "DateTime",
        value: new Date().toISOString(),
      },
    }

    // Update the setting in Orion
    const response = await fetch(`${ORION_BASE_URL}/v2/entities/${id}/attrs`, {
      method: "PATCH",
      headers: orionHeaders,
      body: JSON.stringify(orionUpdates),
    })

    if (!response.ok) {
      throw new Error(`Error updating system setting: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to update system setting:", error)
    throw error
  }
}

// Subscribe to real-time notifications from Orion
export async function subscribeToNotifications<T>(
  entityType: string,
  callback: (data: T[]) => void,
): Promise<() => void> {
  // This would typically be implemented with WebSockets or Server-Sent Events
  // For simplicity, we'll use polling in this example

  let lastData: T[] = []
  let timeoutId: NodeJS.Timeout | null = null
  let isSubscribed = true

  const poll = async () => {
    if (!isSubscribed) return

    try {
      const response = await fetch(`${ORION_BASE_URL}/v2/entities?type=${entityType}`, {
        headers: orionHeaders,
      })

      if (!response.ok) {
        throw new Error(`Error polling ${entityType}: ${response.statusText}`)
      }

      const data = (await response.json()) as T[]

      // Check if data has changed
      if (JSON.stringify(data) !== JSON.stringify(lastData)) {
        lastData = data
        callback(data)
      }
    } catch (error) {
      console.error(`Error polling ${entityType}:`, error)
    }

    // Poll again after delay if still subscribed
    if (isSubscribed) {
      timeoutId = setTimeout(poll, 5000)
    }
  }

  // Start polling
  await poll()

  // Return unsubscribe function
  return () => {
    isSubscribed = false
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    lastData = []
    // This would cancel any WebSocket or SSE subscription
  }
}

// Check FIWARE component status
export async function checkComponentStatus(componentUrl: string): Promise<boolean> {
  try {
    const response = await fetch(componentUrl, {
      method: "HEAD",
      // Add a timeout to avoid long waits
      signal: AbortSignal.timeout(5000),
    })

    return response.ok
  } catch (error) {
    console.error(`Failed to check component status for ${componentUrl}:`, error)
    return false
  }
}

// Get FIWARE component statuses
export async function getFiwareComponentStatuses() {
  return {
    orion: await checkComponentStatus(ORION_BASE_URL + "/version"),
    keyrock: await checkComponentStatus(KEYROCK_BASE_URL + "/version"),
    wirecloud: await checkComponentStatus(WIRECLOUD_BASE_URL + "/api"),
    knowage: await checkComponentStatus(KNOWAGE_BASE_URL + "/api"),
  }
}

// Delete an inventory item from Orion Context Broker
export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${ORION_BASE_URL}/v2/entities/${id}`, {
      method: "DELETE",
      headers: orionHeaders,
    })

    if (!response.ok) {
      throw new Error(`Error deleting inventory item: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to delete inventory item:", error)
    return false
  }
}

