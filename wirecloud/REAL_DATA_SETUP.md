# Setting Up WireCloud with Real Warehouse Data

This guide explains how to connect WireCloud dashboards to your real warehouse data from the Orion Context Broker.

## Prerequisites

1. Your IoT simulator is running and sending data to Orion
2. WireCloud is running and accessible
3. You have basic familiarity with the WireCloud interface

## Step 1: Create a New Dashboard

1. Log in to WireCloud at http://localhost:8000/wirecloud/
2. Go to "My Workspaces" and click "New workspace"
3. Name your dashboard (e.g., "Sensor Dashboard")

## Step 2: Add the NGSI Source Operator

The NGSI Source operator connects to the Orion Context Broker to get real-time data.

1. Click on the "Wiring" button in the top right
2. In the left sidebar, find "NGSI Source" under "Operators"
3. Drag it onto the wiring canvas

## Step 3: Configure the NGSI Source

1. Click on the NGSI Source operator in the wiring view
2. Click "Settings"
3. Configure the following:
   - **NGSI server URL**: `http://orion:1026` (internal Docker network URL)
   - **FIWARE-Service**: `warehouse`
   - **FIWARE-ServicePath**: `/`
   - **NGSI tenant/service**: `warehouse`
   - **NGSI scope**: `/`
   - **NGSI entity types**: Choose one of the following based on your dashboard:
     - `Sensor` (for sensor data)
     - `InventoryItem` (for inventory data)
     - `WarehouseZone` (for warehouse zones)
     - `Alert` (for alerts)
   - **Id pattern**: `.*` (to match all entities)
   - **Monitored NGSI attributes**: Depends on the entity type:
     - For Sensors: `temperature,humidity,weight,scanRate,batteryLevel,location`
     - For InventoryItems: `sku,name,quantity,location,threshold`
     - For WarehouseZones: `name,capacity,currentInventory`
     - For Alerts: `message,severity,zone,timestamp`

4. Click "Accept"

## Step 4: Add Visualization Widgets

Now add widgets to visualize your data:

1. Go back to the dashboard view (click "Back to workspace")
2. Click the "+" button in the top right
3. Browse the widget marketplace or use these recommended widgets:
   - For sensors: "NGSI Browser", "Linear Graph", "Gauge"
   - For inventory: "NGSI Browser", "NGSI Entity List", "Pie Chart"
   - For warehouse zones: "NGSI Entity List", "Bar Chart"
   - For alerts: "NGSI Browser", "Alert List"

4. Drag your chosen widgets onto the dashboard

## Step 5: Wire the Components Together

1. Go back to the "Wiring" view
2. Connect the outputs from the NGSI Source to the inputs of your widgets:
   - Connect "Entities" output to widget inputs that accept entity data
   - Connect specific attribute outputs to widgets that display single values

## Step 6: Test Your Dashboard

1. Go back to the dashboard view
2. Your widgets should now display real-time data from your warehouse
3. If you don't see data, check:
   - The IoT simulator is running
   - The NGSI Source configuration is correct
   - The wiring between components is properly set up

## Example: Temperature Sensor Dashboard

Here's a specific example for creating a temperature sensor dashboard:

1. Create a new workspace named "Temperature Monitoring"
2. Add the NGSI Source operator
3. Configure it for entity type "Sensor" with attribute "temperature"
4. Add a "Linear Graph" widget
5. Add an "NGSI Entity List" widget
6. Wire the NGSI Source "Entities" output to both widgets
7. The dashboard will now show real-time temperature data from all sensors

## Saving and Sharing Your Dashboard

Once your dashboard is working:

1. Click "Save" in the top right
2. To share it, click on the dashboard settings and set it to "Public"
3. You can now access this dashboard from your Smart Warehouse application

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify that data exists in Orion using this command:

