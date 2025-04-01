/**
 * WireCloud NGSI Connector for Smart Warehouse
 *
 * This script helps connect WireCloud widgets to the Orion Context Broker
 * to display real-time data from your warehouse sensors and systems.
 */

// Configuration
const ORION_URL = "http://orion:1026" // Internal Docker network URL
const FIWARE_SERVICE = "warehouse"
const FIWARE_SERVICEPATH = "/"

// Function to create a new NGSI connection in WireCloud
function createNGSIConnection(entityType, attributes) {
  // This is a simplified representation of what you would do in the WireCloud UI
  console.log(`Creating NGSI connection for entity type: ${entityType}`)
  console.log(`Attributes to monitor: ${attributes.join(", ")}`)

  // In the actual WireCloud UI:
  // 1. Add NGSI source operator
  // 2. Configure with these parameters:
  //    - NGSI server URL: ${ORION_URL}
  //    - FIWARE-Service: ${FIWARE_SERVICE}
  //    - FIWARE-ServicePath: ${FIWARE_SERVICEPATH}
  //    - Entity type: ${entityType}
  //    - Monitored attributes: ${attributes}
  // 3. Connect to appropriate widget inputs
}

// Example connections for different entity types
function setupSensorConnections() {
  createNGSIConnection("Sensor", ["temperature", "humidity", "weight", "scanRate", "batteryLevel", "location"])
}

function setupInventoryConnections() {
  createNGSIConnection("InventoryItem", ["sku", "name", "quantity", "location", "threshold"])
}

function setupWarehouseZoneConnections() {
  createNGSIConnection("WarehouseZone", ["name", "capacity", "currentInventory"])
}

function setupAlertConnections() {
  createNGSIConnection("Alert", ["message", "severity", "zone", "timestamp"])
}

// Main setup function
function setupAllConnections() {
  setupSensorConnections()
  setupInventoryConnections()
  setupWarehouseZoneConnections()
  setupAlertConnections()

  console.log("All NGSI connections configured!")
  console.log(`Orion Context Broker URL: ${ORION_URL}`)
  console.log(`FIWARE-Service: ${FIWARE_SERVICE}`)
  console.log(`FIWARE-ServicePath: ${FIWARE_SERVICEPATH}`)
}

// This is a guide script - in practice, you would configure these connections
// through the WireCloud UI or using the WireCloud API

