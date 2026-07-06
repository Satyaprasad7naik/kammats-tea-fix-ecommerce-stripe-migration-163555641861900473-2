#!/bin/bash
echo "Testing API endpoint..."
curl -s http://localhost:5000/api/products | jq '.' | head -n 20
