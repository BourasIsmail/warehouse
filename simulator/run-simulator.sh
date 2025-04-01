#!/bin/bash

# Make this script executable with: chmod +x run-simulator.sh

echo "Starting IoT Device Simulator for Smart Warehouse..."

# Check if running with Docker or locally
if [ "$1" == "docker" ]; then
  echo "Running simulator with Docker Compose..."
  docker-compose -f docker-compose.simulator.yml up -d
  echo "Simulator is running in Docker. Check logs with: docker logs iot-simulator"
else
  echo "Running simulator locally..."
  cd simulator
  npm install
  npm run dev
fi

echo "Simulator started! Your Smart Warehouse is now receiving simulated IoT data."

