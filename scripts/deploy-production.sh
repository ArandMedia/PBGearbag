#!/bin/bash

# Production Deployment Script for PBG Social
# This script deploys the complete stack to production

set -e  # Exit on error

echo "🚀 Starting PBG Social Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production not found${NC}"
    echo "Please create .env.production with required environment variables"
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Building backend Docker image..."
cd backend
docker build --target production -t pbg-backend:latest .
cd ..

echo "📱 Building web app..."
cd mobile
npm run build:web:prod
cd ..

echo "🐳 Starting production services..."
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service health..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services running:"
echo "  - Backend API: http://localhost:3000"
echo "  - Database: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Configure SSL certificates in nginx/ssl/"
echo "  2. Update DNS records to point to this server"
echo "  3. Test the deployment: curl http://localhost:3000/api/v1/health"
echo ""
