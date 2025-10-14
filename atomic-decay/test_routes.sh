#!/bin/bash

echo "Testing route availability..."

# Test assets route
echo "Testing /assets/styles.css..."
curl -I http://localhost:8080/assets/styles.css

echo -e "\nTesting /lti/launch POST..."
curl -X POST http://localhost:8080/lti/launch \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id_token=test&state=test" \
  -I

echo -e "\nTesting /lti/redirect POST..."
curl -X POST http://localhost:8080/lti/redirect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id_token=test&state=test" \
  -I

echo -e "\nTesting /jwks GET..."
curl -I http://localhost:8080/jwks