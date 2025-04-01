#!/bin/bash

# Make this script executable with: chmod +x docker-stop.sh

# Function to display usage information
show_usage() {
  echo "Usage: ./docker-stop.sh [dev|prod]"
  echo "  dev  - Stop the development environment"
  echo "  prod - Stop the production environment"
}

# Check if an argument was provided
if [ $# -eq 0 ]; then
  echo "Error: No environment specified."
  show_usage
  exit 1
fi

# Process the argument
case "$1" in
  dev)
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    ;;
  prod)
    echo "Stopping production environment..."
    docker-compose down
    ;;
  *)
    echo "Error: Invalid environment specified."
    show_usage
    exit 1
    ;;
esac

echo "Done! Your Smart Warehouse Management system has been stopped."

