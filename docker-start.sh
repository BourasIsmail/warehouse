#!/bin/bash

# Make this script executable with: chmod +x docker-start.sh

# Function to display usage information
show_usage() {
  echo "Usage: ./docker-start.sh [dev|prod]"
  echo "  dev  - Start the development environment"
  echo "  prod - Start the production environment"
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
    echo "Starting development environment..."
    docker-compose -f docker-compose.dev.yml up -d
    ;;
  prod)
    echo "Starting production environment..."
    docker-compose up -d
    ;;
  *)
    echo "Error: Invalid environment specified."
    show_usage
    exit 1
    ;;
esac

echo "Done! Your Smart Warehouse Management system is now running."
echo "Access the application at http://localhost:3000"

