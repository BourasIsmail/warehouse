#!/bin/bash

# Make this script executable with: chmod +x start-wirecloud-real-data.sh

echo "Starting WireCloud with real data integration for Smart Warehouse..."

# Start WireCloud and related services with real data configuration
docker-compose -f wirecloud/docker-compose.wirecloud-real-data.yml up -d

echo "Waiting for services to initialize..."
sleep 15

echo "Checking if IoT simulator is sending data to Orion..."
curl -s -X GET "http://localhost:1026/v2/entities?limit=1" \
  -H "FIWARE-Service: warehouse" \
  -H "FIWARE-ServicePath: /" | grep -q "id" && \
  echo "✅ Data confirmed in Orion Context Broker" || \
  echo "❌ No data found in Orion. Make sure the IoT simulator is running."

echo ""
echo "WireCloud is now running with real data integration!"
echo "Access WireCloud at: http://localhost:8000/wirecloud/"
echo "Default login credentials:"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "For detailed instructions on setting up dashboards with real data,"
echo "please refer to the REAL_DATA_SETUP.md file in the wirecloud directory."

