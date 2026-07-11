# PBG Social - Production Deployment Guide

Complete guide for deploying PBG Social to production at pbg.social and api.pbg.social

## Quick Start

```bash
# 1. Fill in production environment variables
vim .env.production

# 2. Run complete deployment
./scripts/deploy-production.sh

# 3. Set up SSL certificates
./scripts/setup-ssl.sh

# 4. Verify deployment
curl https://api.pbg.social/api/v1/health
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- Docker and Docker Compose
- Domain names configured:
  - `pbg.social` → server IP
  - `api.pbg.social` → server IP
- Minimum specs:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage

### Optional (for production features)

- AWS account (for S3 file storage)
- Stripe account (for future payment features)
- SMTP credentials (for email notifications)

---

## Environment Setup

### 1. Generate JWT Secrets

```bash
# Generate secure random secrets
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for REFRESH_TOKEN_SECRET
```

### 2. Configure Environment Variables

Edit `.env.production`:

```bash
# Database
DATABASE_PASSWORD=your_secure_db_password_here

# Redis
REDIS_PASSWORD=your_secure_redis_password_here

# JWT Secrets (from step 1)
JWT_SECRET=your_generated_jwt_secret_here
REFRESH_TOKEN_SECRET=your_generated_refresh_secret_here

# AWS S3 (get from AWS console)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Stripe (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 3. Update Brand Colors (Optional)

Once you have brand assets from pbgearbag.com, update:

**File:** `mobile/src/theme/colors.ts`

```typescript
export const colors = {
  primary: '#YOUR_PRIMARY_COLOR',
  secondary: '#YOUR_SECONDARY_COLOR',
  // ... update other colors
};
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

Best for: Single server, getting started quickly

**Pros:**
- Simple setup
- All-in-one deployment
- Easy to manage

**Cons:**
- Single point of failure
- Limited scalability

### Option 2: Kubernetes

Best for: Large scale, high availability

**Pros:**
- Auto-scaling
- High availability
- Load balancing

**Cons:**
- Complex setup
- Higher costs

### Option 3: Serverless (Vercel + AWS)

Best for: Web-only, minimal ops

**Pros:**
- No server management
- Auto-scaling
- CDN included

**Cons:**
- Backend requires separate hosting
- Can be expensive at scale

---

## Step-by-Step Deployment

### Deploy Backend API (api.pbg.social)

#### 1. Build Backend Docker Image

```bash
cd backend
docker build --target production -t pbg-backend:latest .
```

#### 2. Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.production.yml up -d postgres redis

# Wait for services to be healthy
docker-compose -f docker-compose.production.yml ps
```

#### 3. Run Database Migrations

```bash
# Connect to backend container
docker-compose -f docker-compose.production.yml run --rm backend npm run migration:run
```

#### 4. Start Backend Service

```bash
docker-compose -f docker-compose.production.yml up -d backend
```

#### 5. Verify Backend

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs -f backend

# Test API
curl http://localhost:3000/api/v1/health
```

---

### Deploy Web App (pbg.social)

#### 1. Build Web App

```bash
cd mobile
npm ci
npm run build:web:prod
```

Build output: `mobile/dist/`

#### 2. Deploy Web Files

**Using Docker Compose (with Nginx):**

```bash
# Nginx is already configured in docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d nginx
```

**OR Using Vercel:**

```bash
npm i -g vercel
cd mobile
vercel --prod
```

**OR Using Netlify:**

```bash
npm i -g netlify-cli
cd mobile
netlify deploy --prod --dir=dist
```

**OR Using AWS S3 + CloudFront:**

```bash
# Upload to S3
aws s3 sync dist/ s3://pbg-social-web --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths '/*'
```

---

### Set Up SSL Certificates

#### Option 1: Let's Encrypt (Free, Automated)

```bash
./scripts/setup-ssl.sh
# Choose option 1
# Follow prompts
```

#### Option 2: Manual Certificates

1. Obtain certificates from your provider
2. Place certificates:
   ```
   nginx/ssl/pbg.social/fullchain.pem
   nginx/ssl/pbg.social/privkey.pem
   nginx/ssl/api.pbg.social/fullchain.pem
   nginx/ssl/api.pbg.social/privkey.pem
   ```
3. Restart nginx:
   ```bash
   docker-compose -f docker-compose.production.yml restart nginx
   ```

---

### Configure DNS

Point your domains to your server:

```
# A Records
pbg.social           → YOUR_SERVER_IP
www.pbg.social       → YOUR_SERVER_IP
api.pbg.social       → YOUR_SERVER_IP

# Optional: CAA Records (for SSL)
pbg.social    CAA    0 issue "letsencrypt.org"
```

Wait for DNS propagation (can take up to 48 hours, usually ~10 minutes)

---

## Post-Deployment

### 1. Verify Everything Works

```bash
# Test API
curl https://api.pbg.social/api/v1/health

# Test API docs
open https://api.pbg.social/api/docs

# Test web app
open https://pbg.social

# Create test account
# Register via mobile app or web
```

### 2. Create Admin Account

```bash
# Connect to database
docker exec -it pbg-postgres-prod psql -U postgres -d pbg_production

# Update user to admin
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 3. Set Up Monitoring

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Check service health
docker-compose -f docker-compose.production.yml ps
```

### 4. Configure Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec pbg-postgres-prod pg_dump -U postgres pbg_production > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://pbg-backups/database/
```

Add to cron for daily backups:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl https://api.pbg.social/api/v1/health

# Database connection
docker exec -it pbg-postgres-prod pg_isready -U postgres

# Redis connection
docker exec -it pbg-redis-prod redis-cli -a $REDIS_PASSWORD ping
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Backend only
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./scripts/deploy-production.sh

# OR manually:
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Database Migrations

```bash
# Run new migrations
docker-compose -f docker-compose.production.yml run --rm backend npm run migration:run

# Revert migration
docker-compose -f docker-compose.production.yml run --rm backend npm run migration:revert
```

---

## Troubleshooting

### API Returns 502 Bad Gateway

```bash
# Check if backend is running
docker-compose -f docker-compose.production.yml ps backend

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Restart backend
docker-compose -f docker-compose.production.yml restart backend
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.production.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.production.yml logs postgres

# Connect to database manually
docker exec -it pbg-postgres-prod psql -U postgres -d pbg_production
```

### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/pbg.social/fullchain.pem -noout -dates

# Renew Let's Encrypt certificates
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/pbg.social/* nginx/ssl/pbg.social/
docker-compose -f docker-compose.production.yml restart nginx
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart all services
docker-compose -f docker-compose.production.yml restart

# If issue persists, increase server resources
```

### Web App Not Loading

```bash
# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx

# Verify static files exist
ls -la mobile/dist/

# Rebuild web app
cd mobile && npm run build:web:prod

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

---

## Performance Optimization

### Enable Redis Caching

Already configured in production. Monitor cache hit rate:

```bash
docker exec -it pbg-redis-prod redis-cli -a $REDIS_PASSWORD INFO stats
```

### Database Optimization

```sql
-- Create indexes (if not already created by migrations)
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_created ON listings(created_at);
```

### CDN Setup (Optional)

Use CloudFront or Cloudflare to cache static assets:

1. Create CDN distribution pointing to pbg.social
2. Update `mobile/.env.production` with CDN URL
3. Rebuild web app

---

## Security Checklist

- [ ] JWT secrets are random and secure
- [ ] Database passwords are strong
- [ ] SSL certificates are valid and auto-renewing
- [ ] CORS is configured for pbg.social only
- [ ] Rate limiting is enabled (in nginx.conf)
- [ ] Environment variables are not committed to git
- [ ] Regular backups are configured
- [ ] Docker containers run as non-root users
- [ ] Firewall is configured (only 80, 443 open)

---

## Costs Estimate

### Option 1: Single VPS (DigitalOcean/AWS)

- **Server:** $20-40/month (4GB RAM, 2 vCPUs)
- **S3 Storage:** $5-10/month (estimated)
- **Domain:** $12/year
- **SSL:** Free (Let's Encrypt)

**Total:** ~$30-50/month

### Option 2: Managed Services

- **Vercel (web):** Free tier or $20/month
- **Railway/Render (backend):** $20-50/month
- **Managed PostgreSQL:** $15-30/month
- **S3 Storage:** $5-10/month

**Total:** ~$60-110/month

---

## Support & Resources

- **API Documentation:** https://api.pbg.social/api/docs
- **GitHub Repository:** https://github.com/ArandMedia/PBG
- **Testing Guide:** See `TESTING_GUIDE.md`

---

**Deployment Status:**

- ✅ Backend API ready for deployment
- ✅ Web app ready for deployment
- ✅ Docker configuration complete
- ✅ SSL setup scripts ready
- ⏳ Waiting for production environment variables
- ⏳ Waiting for DNS configuration
- ⏳ Waiting for brand assets from pbgearbag.com

---

**Next Steps:**

1. Fill in `.env.production` with real values
2. Update brand colors in `mobile/src/theme/colors.ts`
3. Configure DNS for pbg.social and api.pbg.social
4. Run deployment scripts
5. Test everything works
6. Go live! 🚀
