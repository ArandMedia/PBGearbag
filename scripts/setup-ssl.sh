#!/bin/bash

# SSL Certificate Setup Script
# Sets up Let's Encrypt SSL certificates for pbg.social and api.pbg.social

set -e

echo "🔒 Setting up SSL certificates..."

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# Create SSL directories
mkdir -p nginx/ssl/pbg.social
mkdir -p nginx/ssl/api.pbg.social

echo ""
echo "Choose SSL setup method:"
echo "1. Let's Encrypt (automated, free)"
echo "2. Custom certificates (manual)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Setting up Let's Encrypt certificates..."
    echo ""

    read -p "Enter your email: " email
    read -p "Enter domain (e.g., pbg.social): " domain
    read -p "Enter API domain (e.g., api.pbg.social): " api_domain

    echo ""
    echo "Generating certificates..."

    sudo certbot certonly --standalone \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        -d "$domain" \
        -d "www.$domain"

    sudo certbot certonly --standalone \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        -d "$api_domain"

    # Copy certificates to nginx directory
    sudo cp /etc/letsencrypt/live/"$domain"/fullchain.pem nginx/ssl/pbg.social/
    sudo cp /etc/letsencrypt/live/"$domain"/privkey.pem nginx/ssl/pbg.social/
    sudo cp /etc/letsencrypt/live/"$api_domain"/fullchain.pem nginx/ssl/api.pbg.social/
    sudo cp /etc/letsencrypt/live/"$api_domain"/privkey.pem nginx/ssl/api.pbg.social/

    echo ""
    echo "✅ SSL certificates installed!"
    echo ""
    echo "Certificates will auto-renew. To test renewal:"
    echo "  sudo certbot renew --dry-run"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "Manual certificate setup:"
    echo "1. Place your certificates in:"
    echo "   - nginx/ssl/pbg.social/fullchain.pem"
    echo "   - nginx/ssl/pbg.social/privkey.pem"
    echo "   - nginx/ssl/api.pbg.social/fullchain.pem"
    echo "   - nginx/ssl/api.pbg.social/privkey.pem"
    echo ""
    echo "2. Then restart nginx:"
    echo "   docker-compose -f docker-compose.production.yml restart nginx"
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "Next step: Update nginx configuration and restart services"
