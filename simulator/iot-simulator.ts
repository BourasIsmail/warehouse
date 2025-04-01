/**
 * IoT Device Simulator for Smart Warehouse
 *
 * This script simulates various IoT devices sending data to the FIWARE Orion Context Broker.
 * It creates virtual temperature sensors, weight sensors, RFID scanners, and humidity sensors.
 */

import fetch from "node-fetch"
import { v4 as uuidv4 } from "uuid"

// Configuration
const ORION_URL = process.env.ORION_URL || "http://localhost:1026"
const FIWARE_SERVICE = "warehouse"
const FIWARE_SERVICEPATH = "/"
const SIMULATION_INTERVAL = 5000 // 5 seconds

// Warehouse zones
const WAREHOUSE_ZONES = [
  "Zone A - Cold Storage",
  "Zone B - General Storage",
  "Zone C - High Value Items",
  "Zone D - Shipping Area",
  "Zone E - Receiving Area",
]

// Sensor types
type SensorType = "temperature" | "weight" | "rfid" | "humidity"

// Sensor class
class Sensor {
  id: string
  type: SensorType
  name: string
  location: string
  batteryLevel: number
  lastUpdated: Date

  constructor(type: SensorType, name: string, location: string) {
    this.id = `Sensor:${type}:${uuidv4().substring(0, 8)}`
    this.type = type
    this.name = name
    this.location = location
    this.batteryLevel = 100
    this.lastUpdated = new Date()
  }

  // Generate random value based on sensor type
  generateValue(): any {
    switch (this.type) {
      case "temperature":
        // Temperature between -5 and 30 degrees Celsius
        return Number.parseFloat((Math.random() * 35 - 5).toFixed(1))
      case "weight":
        // Weight between 0 and 1000 kg
        return Math.floor(Math.random() * 1000)
      case "rfid":
        // RFID scan rate between 0 and 50 scans per minute
        return Math.floor(Math.random() * 50)
      case "humidity":
        // Humidity between 20% and 90%
        return Number.parseFloat((Math.random() * 70 + 20).toFixed(1))
      default:
        return 0
    }
  }

  // Decrease battery level randomly
  updateBatteryLevel() {
    // Decrease by 0-0.5% each time
    this.batteryLevel -= Math.random() * 0.5
    if (this.batteryLevel < 0) this.batteryLevel = 0
  }

  // Create entity for Orion Context Broker
  toOrionEntity() {
    const value = this.generateValue()
    this.lastUpdated = new Date()
    this.updateBatteryLevel()

    const entity: any = {
      id: this.id,
      type: "Sensor",
      name: {
        type: "Text",
        value: this.name,
      },
      sensorType: {
        type: "Text",
        value: this.type,
      },
      location: {
        type: "Text",
        value: this.location,
      },
      batteryLevel: {
        type: "Number",
        value: this.batteryLevel,
      },
      dateModified: {
        type: "DateTime",
        value: this.lastUpdated.toISOString(),
      },
    }

    // Add specific attribute based on sensor type
    switch (this.type) {
      case "temperature":
        entity.temperature = {
          type: "Number",
          value: value,
        }
        break
      case "weight":
        entity.weight = {
          type: "Number",
          value: value,
        }
        break
      case "rfid":
        entity.scanRate = {
          type: "Number",
          value: value,
        }
        break
      case "humidity":
        entity.humidity = {
          type: "Number",
          value: value,
        }
        break
    }

    return entity
  }
}

// Warehouse zone class
class WarehouseZone {
  id: string
  name: string
  capacity: number
  currentInventory: number
  lastUpdated: Date

  constructor(name: string, capacity: number) {
    this.id = `WarehouseZone:${uuidv4().substring(0, 8)}`
    this.name = name
    this.capacity = capacity
    this.currentInventory = Math.floor(Math.random() * capacity * 0.8) // Start with 0-80% capacity
    this.lastUpdated = new Date()
  }

  // Update inventory level randomly
  updateInventory() {
    // Change by -10% to +10% of capacity
    const change = Math.floor((Math.random() * 0.2 - 0.1) * this.capacity)
    this.currentInventory += change

    // Ensure within bounds
    if (this.currentInventory > this.capacity) this.currentInventory = this.capacity
    if (this.currentInventory < 0) this.currentInventory = 0

    this.lastUpdated = new Date()
  }

  // Create entity for Orion Context Broker
  toOrionEntity() {
    this.updateInventory()

    return {
      id: this.id,
      type: "WarehouseZone",
      name: {
        type: "Text",
        value: this.name,
      },
      capacity: {
        type: "Number",
        value: this.capacity,
      },
      currentInventory: {
        type: "Number",
        value: this.currentInventory,
      },
      dateModified: {
        type: "DateTime",
        value: this.lastUpdated.toISOString(),
      },
    }
  }
}

// Alert class
class Alert {
  id: string
  message: string
  severity: "critical" | "warning" | "info" | "resolved"
  zone: string
  timestamp: Date

  constructor(message: string, severity: "critical" | "warning" | "info" | "resolved", zone: string) {
    this.id = `Alert:${uuidv4().substring(0, 8)}`
    this.message = message
    this.severity = severity
    this.zone = zone
    this.timestamp = new Date()
  }

  // Create entity for Orion Context Broker
  toOrionEntity() {
    return {
      id: this.id,
      type: "Alert",
      message: {
        type: "Text",
        value: this.message,
      },
      severity: {
        type: "Text",
        value: this.severity,
      },
      zone: {
        type: "Text",
        value: this.zone,
      },
      timestamp: {
        type: "DateTime",
        value: this.timestamp.toISOString(),
      },
    }
  }
}

// Inventory item class
class InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  location: string
  threshold: number
  lastUpdated: Date

  constructor(sku: string, name: string, location: string) {
    this.id = `InventoryItem:${uuidv4().substring(0, 8)}`
    this.sku = sku
    this.name = name
    this.location = location
    this.quantity = Math.floor(Math.random() * 200)
    this.threshold = 20
    this.lastUpdated = new Date()
  }

  // Update quantity randomly
  updateQuantity() {
    // Change by -5 to +5 items
    const change = Math.floor(Math.random() * 11) - 5
    this.quantity += change

    // Ensure not negative
    if (this.quantity < 0) this.quantity = 0

    this.lastUpdated = new Date()
  }

  // Create entity for Orion Context Broker
  toOrionEntity() {
    this.updateQuantity()

    return {
      id: this.id,
      type: "InventoryItem",
      sku: {
        type: "Text",
        value: this.sku,
      },
      name: {
        type: "Text",
        value: this.name,
      },
      quantity: {
        type: "Number",
        value: this.quantity,
      },
      location: {
        type: "Text",
        value: this.location,
      },
      threshold: {
        type: "Number",
        value: this.threshold,
      },
      dateModified: {
        type: "DateTime",
        value: this.lastUpdated.toISOString(),
      },
    }
  }
}

// Create sensors
const createSensors = () => {
  const sensors: Sensor[] = []

  // Create temperature sensors for each zone
  WAREHOUSE_ZONES.forEach((zone) => {
    sensors.push(new Sensor("temperature", `Temperature Sensor - ${zone}`, zone))
  })

  // Create weight sensors for some zones
  ;["Zone B - General Storage", "Zone C - High Value Items"].forEach((zone) => {
    sensors.push(new Sensor("weight", `Weight Sensor - ${zone}`, zone))
  })

  // Create RFID scanners for shipping and receiving
  ;["Zone D - Shipping Area", "Zone E - Receiving Area"].forEach((zone) => {
    sensors.push(new Sensor("rfid", `RFID Scanner - ${zone}`, zone))
  })

  // Create humidity sensors for cold storage
  sensors.push(new Sensor("humidity", "Humidity Sensor - Cold Storage", "Zone A - Cold Storage"))

  return sensors
}

// Create warehouse zones
const createWarehouseZones = () => {
  return WAREHOUSE_ZONES.map((zone) => {
    // Different capacities for different zones
    let capacity = 1000
    if (zone.includes("Cold Storage")) capacity = 500
    if (zone.includes("High Value")) capacity = 300
    if (zone.includes("Shipping")) capacity = 200
    if (zone.includes("Receiving")) capacity = 200

    return new WarehouseZone(zone, capacity)
  })
}

// Create inventory items
const createInventoryItems = () => {
  const items: InventoryItem[] = []

  // Sample products
  const products = [
    { sku: "ELEC-001", name: "Smartphone X1" },
    { sku: "ELEC-002", name: 'Laptop Pro 15"' },
    { sku: "ELEC-003", name: "Wireless Headphones" },
    { sku: "FOOD-001", name: "Organic Apples (5kg)" },
    { sku: "FOOD-002", name: "Premium Coffee Beans" },
    { sku: "FOOD-003", name: "Frozen Pizza Pack" },
    { sku: "CLOTH-001", name: "Winter Jacket" },
    { sku: "CLOTH-002", name: "Running Shoes" },
    { sku: "CLOTH-003", name: "Cotton T-Shirts (5-Pack)" },
    { sku: "HOME-001", name: "Smart Speaker" },
    { sku: "HOME-002", name: "Kitchen Blender" },
    { sku: "HOME-003", name: "Bed Linen Set" },
  ]

  // Distribute products across zones
  products.forEach((product) => {
    let zone = WAREHOUSE_ZONES[Math.floor(Math.random() * WAREHOUSE_ZONES.length)]

    // Place food items in cold storage
    if (product.sku.startsWith("FOOD")) {
      zone = "Zone A - Cold Storage"
    }

    // Place electronics in high value zone
    if (product.sku.startsWith("ELEC")) {
      zone = "Zone C - High Value Items"
    }

    items.push(new InventoryItem(product.sku, product.name, zone))
  })

  return items
}

// Generate random alerts
const generateRandomAlert = (): Alert | null => {
  // Only generate an alert occasionally (10% chance)
  if (Math.random() > 0.1) return null

  const zone = WAREHOUSE_ZONES[Math.floor(Math.random() * WAREHOUSE_ZONES.length)]
  const alertTypes = [
    { message: "Temperature exceeding threshold", severity: "warning" as const, zone: "Zone A - Cold Storage" },
    { message: "Critical temperature alert", severity: "critical" as const, zone: "Zone A - Cold Storage" },
    { message: "Low inventory warning", severity: "warning" as const },
    { message: "Unauthorized access detected", severity: "critical" as const },
    { message: "Sensor battery low", severity: "info" as const },
    { message: "Shipment arrived", severity: "info" as const, zone: "Zone E - Receiving Area" },
    { message: "Shipment dispatched", severity: "info" as const, zone: "Zone D - Shipping Area" },
    { message: "System maintenance completed", severity: "resolved" as const },
  ]

  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
  return new Alert(alertType.message, alertType.severity, alertType.zone || zone)
}

// Send entity to Orion Context Broker
const sendToOrion = async (entity: any) => {
  try {
    // Check if entity exists
    const checkResponse = await fetch(`${ORION_URL}/v2/entities/${entity.id}?type=${entity.type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Fiware-Service": FIWARE_SERVICE,
        "Fiware-ServicePath": FIWARE_SERVICEPATH,
      },
    })

    if (checkResponse.status === 404) {
      // Entity doesn't exist, create it
      const createResponse = await fetch(`${ORION_URL}/v2/entities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Fiware-Service": FIWARE_SERVICE,
          "Fiware-ServicePath": FIWARE_SERVICEPATH,
        },
        body: JSON.stringify(entity),
      })

      if (!createResponse.ok) {
        console.error(`Error creating entity ${entity.id}: ${createResponse.statusText}`)
      } else {
        console.log(`Created entity ${entity.id}`)
      }
    } else {
      // Entity exists, update it
      const updateResponse = await fetch(`${ORION_URL}/v2/entities/${entity.id}/attrs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Fiware-Service": FIWARE_SERVICE,
          "Fiware-ServicePath": FIWARE_SERVICEPATH,
        },
        body: JSON.stringify(
          Object.fromEntries(Object.entries(entity).filter(([key]) => !["id", "type"].includes(key))),
        ),
      })

      if (!updateResponse.ok) {
        console.error(`Error updating entity ${entity.id}: ${updateResponse.statusText}`)
      } else {
        console.log(`Updated entity ${entity.id}`)
      }
    }
  } catch (error) {
    console.error(`Error sending entity ${entity.id} to Orion:`, error)
  }
}

// Main simulation function
const runSimulation = async () => {
  console.log("Starting IoT device simulation for Smart Warehouse...")

  // Create simulated devices and entities
  const sensors = createSensors()
  const zones = createWarehouseZones()
  const inventoryItems = createInventoryItems()

  console.log(
    `Created ${sensors.length} sensors, ${zones.length} warehouse zones, and ${inventoryItems.length} inventory items`,
  )

  // Run simulation loop
  setInterval(async () => {
    console.log(`Sending data at ${new Date().toISOString()}`)

    // Update and send sensor data
    for (const sensor of sensors) {
      await sendToOrion(sensor.toOrionEntity())
    }

    // Update and send warehouse zone data
    for (const zone of zones) {
      await sendToOrion(zone.toOrionEntity())
    }

    // Update and send inventory data (only update a few items each time)
    for (let i = 0; i < 3; i++) {
      const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)]
      await sendToOrion(item.toOrionEntity())
    }

    // Generate and send random alerts
    const alert = generateRandomAlert()
    if (alert) {
      await sendToOrion(alert.toOrionEntity())
    }
  }, SIMULATION_INTERVAL)
}

// Start the simulation
runSimulation().catch((error) => {
  console.error("Error running simulation:", error)
})

