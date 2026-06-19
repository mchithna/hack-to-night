#!/bin/bash
# Production deployment script

set -e  # Exit on any error

echo "🚀 HTN26 Production Deployment"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose not installed${NC}"; exit 1; }

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production based on .env.production.example"
    exit 1
fi

# Stop running containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Build production image
echo -e "${YELLOW}Building production image...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache app

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Display logs
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${YELLOW}Application logs:${NC}"
docker-compose -f docker-compose.prod.yml logs -f app &

echo ""
echo -e "${GREEN}Services running:${NC}"
echo "- Next.js App: http://localhost:3000"
echo "- PostgreSQL: localhost:5432"
echo "- Nginx: http://localhost"
echo ""
echo -e "${YELLOW}To stop deployment: docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "${YELLOW}To view logs: docker-compose -f docker-compose.prod.yml logs -f${NC}"
