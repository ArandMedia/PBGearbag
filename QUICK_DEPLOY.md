# Quick Deploy Guide - PBG Social

Get PBG Social deployed to production in under 30 minutes.

## Prerequisites

- Ubuntu/Debian server with root access
- Docker and Docker Compose installed
- Domains configured: `pbg.social` and `api.pbg.social`

## Step 1: Server Setup (5 minutes)

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Clone repository
git clone https://github.com/ArandMedia/PBG.git
cd PBG
```

## Step 2: Configure Environment (5 minutes)

```bash
# Generate JWT secrets
openssl rand -base64 64  # Copy this for JWT_SECRET
openssl rand -base64 64  # Copy this for REFRESH_TOKEN_SECRET

# Edit production environment file
nano .env.production
```

**Minimal configuration (fill these in):**
```env
DATABASE_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=paste_first_generated_secret_here
REFRESH_TOKEN_SECRET=paste_second_generated_secret_here
```

Save and exit (Ctrl+X, Y, Enter)

## Step 3: Deploy Backend (10 minutes)

```bash
# Run deployment script
chmod +x scripts/*.sh
./scripts/deploy-production.sh
```

This will:
- Build backend Docker image
- Start PostgreSQL and Redis
- Start backend API
- Wait for health checks

**Verify:**
```bash
curl http://localhost:3000/api/v1/health
# Should return: {"status":"ok"}
```

## Step 4: Deploy Web App (5 minutes)

```bash
# Install dependencies and build
cd mobile
npm install
npm run build:web:prod
cd ..

# Start nginx
docker-compose -f docker-compose.production.yml up -d nginx
```

## Step 5: Setup SSL (5 minutes)

```bash
./scripts/setup-ssl.sh
# Choose option 1 for Let's Encrypt
# Enter your email when prompted
```

## Step 6: Verify Deployment (2 minutes)

```bash
# Test API
curl https://api.pbg.social/api/v1/health

# Test web app
curl https://pbg.social

# Open in browser
# https://pbg.social - Web app should load
# https://api.pbg.social/api/docs - API docs should load
```

## Done! 🎉

Your PBG Social platform is now live at:
- **Web App:** https://pbg.social
- **API:** https://api.pbg.social
- **API Docs:** https://api.pbg.social/api/docs

## Next Steps

1. **Update Branding:**
   - Edit `mobile/src/theme/colors.ts` with your brand colors
   - Rebuild web: `cd mobile && npm run build:web:prod`
   - Restart nginx: `docker-compose -f docker-compose.production.yml restart nginx`

2. **Create Admin Account:**
   - Register via web app: https://pbg.social
   - Promote to admin:
     ```bash
     docker exec -it pbg-postgres-prod psql -U postgres -d pbg_production
     UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
     ```

3. **Set Up Backups:**
   - Configure automated daily backups (see DEPLOYMENT_GUIDE.md)

4. **Deploy Mobile Apps:**
   - See DEPLOYMENT_GUIDE.md for iOS/Android deployment

## Troubleshooting

**Port 80/443 already in use:**
```bash
sudo netstat -tulpn | grep :80
sudo systemctl stop apache2  # or nginx, or whatever is using the port
```

**SSL certificate error:**
```bash
# Make sure DNS is pointing to your server first
dig pbg.social
dig api.pbg.social

# Then retry SSL setup
./scripts/setup-ssl.sh
```

**API not responding:**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Restart services
docker-compose -f docker-compose.production.yml restart
```

## Need Help?

- Full guide: See `DEPLOYMENT_GUIDE.md`
- Testing: See `TESTING_GUIDE.md`
- Architecture: See `ARCHITECTURE.md`
