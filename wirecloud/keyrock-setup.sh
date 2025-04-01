#!/bin/bash

# Make this script executable with: chmod +x keyrock-setup.sh

echo "Setting up Keyrock Identity Management for WireCloud integration..."

# Wait for Keyrock to be ready
echo "Waiting for Keyrock to be ready..."
until $(curl --output /dev/null --silent --head --fail http://localhost:3005); do
    printf '.'
    sleep 5
done
echo "Keyrock is up!"

# Get authentication token
echo "Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3005/v1/auth/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin@warehouse.com",
    "password": "admin"
  }' | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "Failed to get authentication token. Make sure Keyrock is running."
  exit 1
fi

echo "Authentication successful!"

# Create application for WireCloud if it doesn't exist
echo "Checking if WireCloud application exists..."
APP_ID=$(curl -s -X GET http://localhost:3005/v1/applications \
  -H "X-Auth-token: $TOKEN" | jq -r '.applications[] | select(.name=="WireCloud") | .id')

if [ -z "$APP_ID" ]; then
  echo "Creating WireCloud application in Keyrock..."
  APP_RESPONSE=$(curl -s -X POST http://localhost:3005/v1/applications \
    -H "Content-Type: application/json" \
    -H "X-Auth-token: $TOKEN" \
    -d '{
      "application": {
        "name": "WireCloud",
        "description": "WireCloud Dashboard Platform",
        "redirect_uri": "http://localhost:8000/complete/fiware/",
        "url": "http://localhost:8000",
        "grant_type": "authorization_code,implicit,password",
        "token_types": ["permanent"]
      }
    }')
  
  APP_ID=$(echo $APP_RESPONSE | jq -r '.application.id')
  CLIENT_ID=$(echo $APP_RESPONSE | jq -r '.application.oauth_client_id')
  CLIENT_SECRET=$(echo $APP_RESPONSE | jq -r '.application.oauth_client_secret')
  
  echo "WireCloud application created with ID: $APP_ID"
  echo "Client ID: $CLIENT_ID"
  echo "Client Secret: $CLIENT_SECRET"
  
  # Update the environment variables in docker-compose file
  echo "Updating docker-compose file with new credentials..."
  sed -i "s/SOCIAL_AUTH_FIWARE_KEY=.*/SOCIAL_AUTH_FIWARE_KEY=$CLIENT_ID/" wirecloud/docker-compose.wirecloud-real-data.yml
  sed -i "s/SOCIAL_AUTH_FIWARE_SECRET=.*/SOCIAL_AUTH_FIWARE_SECRET=$CLIENT_SECRET/" wirecloud/docker-compose.wirecloud-real-data.yml
  
  echo "You'll need to restart the services for the changes to take effect:"
  echo "docker-compose -f wirecloud/docker-compose.wirecloud-real-data.yml down"
  echo "docker-compose -f wirecloud/docker-compose.wirecloud-real-data.yml up -d"
else
  echo "WireCloud application already exists with ID: $APP_ID"
fi

# Create permissions for accessing Orion Context Broker
echo "Setting up permissions for Orion Context Broker access..."
PERMISSION_RESPONSE=$(curl -s -X POST http://localhost:3005/v1/applications/$APP_ID/permissions \
  -H "Content-Type: application/json" \
  -H "X-Auth-token: $TOKEN" \
  -d '{
    "permission": {
      "name": "Get Entities",
      "description": "Permission to read entities from Orion Context Broker",
      "action": "GET",
      "resource": "/v2/entities"
    }
  }')

PERMISSION_ID=$(echo $PERMISSION_RESPONSE | jq -r '.permission.id')
echo "Permission created with ID: $PERMISSION_ID"

# Create a role for warehouse users
echo "Creating Warehouse User role..."
ROLE_RESPONSE=$(curl -s -X POST http://localhost:3005/v1/applications/$APP_ID/roles \
  -H "Content-Type: application/json" \
  -H "X-Auth-token: $TOKEN" \
  -d '{
    "role": {
      "name": "Warehouse User"
    }
  }')

ROLE_ID=$(echo $ROLE_RESPONSE | jq -r '.role.id')
echo "Role created with ID: $ROLE_ID"

# Assign permission to role
echo "Assigning permission to role..."
curl -s -X POST http://localhost:3005/v1/applications/$APP_ID/roles/$ROLE_ID/permissions/$PERMISSION_ID \
  -H "X-Auth-token: $TOKEN"

echo "Keyrock setup completed successfully!"
echo ""
echo "You can now access Keyrock at: http://localhost:3005"
echo "Default login credentials:"
echo "  Username: admin@warehouse.com"
echo "  Password: admin"
echo ""
echo "WireCloud is now configured to use Keyrock for authentication."

