#!/bin/bash
# Local production build and test script

set -e

echo "🔨 Building production image locally..."
docker build -f Dockerfile.prod -t htn-app:latest .

echo "📦 Image built successfully!"
docker images | grep htn-app

echo ""
echo "To run locally for testing:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "To push to registry:"
echo "  docker tag htn-app:latest your-registry/htn-app:latest"
echo "  docker push your-registry/htn-app:latest"
