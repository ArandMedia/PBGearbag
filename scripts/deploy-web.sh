#!/bin/bash

# Web App Deployment Script
# Builds and deploys the web version to pbg.social

set -e

echo "🌐 Building PBG Social Web App..."

cd mobile

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🔨 Building for production..."
EXPO_PUBLIC_ENV=production npm run build:web

echo ""
echo "✅ Web build complete!"
echo ""
echo "Build output location: mobile/dist/"
echo ""
echo "Deployment options:"
echo ""
echo "1. Using Nginx (in docker-compose.production.yml):"
echo "   - Build output is already configured to mount at /usr/share/nginx/html"
echo "   - Just run: docker-compose -f docker-compose.production.yml up -d nginx"
echo ""
echo "2. Using Vercel:"
echo "   - Install: npm i -g vercel"
echo "   - Deploy: cd mobile && vercel --prod"
echo ""
echo "3. Using Netlify:"
echo "   - Install: npm i -g netlify-cli"
echo "   - Deploy: cd mobile && netlify deploy --prod --dir=dist"
echo ""
echo "4. Using AWS S3 + CloudFront:"
echo "   - aws s3 sync dist/ s3://pbg-social-web"
echo "   - aws cloudfront create-invalidation --distribution-id XXX --paths '/*'"
echo ""
