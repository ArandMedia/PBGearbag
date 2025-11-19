# GoDaddy WordPress Hosting Deployment Plan

## Your Setup

- **Hosting Type:** GoDaddy WordPress Hosting
- **Server IP:** 72.167.211.68
- **PHP Version:** 8.2
- **SSH Access:** OFF (No SSH)
- **SSL:** Included with hosting (likely wildcard)
- **cPanel:** Available ✅
- **FTP:** Available ✅

## Deployment Strategy

Since WordPress hosting doesn't support Node.js/Docker, we'll use a **hybrid approach**:

### Architecture

```
pbg.social (Web App)
├─ Hosted on: GoDaddy WordPress Hosting
├─ Type: Static files (HTML/CSS/JS)
├─ Deployment: FTP upload
└─ SSL: GoDaddy certificate ✅

api.pbg.social (Backend API)
├─ Hosted on: DigitalOcean/Vultr VPS
├─ Type: Node.js + PostgreSQL + Redis
├─ Deployment: Docker
├─ SSL: Let's Encrypt (free)
└─ Cost: $6-12/month
```

## Step-by-Step Deployment

### Phase 1: Set Up VPS for Backend API (30 minutes)

**Option 1: DigitalOcean (Recommended)**
1. Sign up at digitalocean.com
2. Create Droplet:
   - Image: Ubuntu 22.04
   - Plan: Basic ($12/month for 2GB RAM)
   - Datacenter: North America (same as GoDaddy)
   - Add SSH key or use password
3. Note the VPS IP address

**Option 2: Vultr (Cheaper)**
1. Sign up at vultr.com
2. Deploy server:
   - Server Type: Cloud Compute
   - Location: North America
   - Plan: $6/month (1GB RAM)
   - OS: Ubuntu 22.04

**I can help you set this up if you create an account and share VPS credentials.**

### Phase 2: DNS Configuration

**In GoDaddy DNS Manager, add these records:**

```
Type: A
Name: @
Value: 72.167.211.68
TTL: 600 (or 1 hour)

Type: A
Name: www
Value: 72.167.211.68
TTL: 600

Type: A
Name: api
Value: [YOUR_VPS_IP_ADDRESS]
TTL: 600
```

**How to add DNS records in GoDaddy:**
1. Log into GoDaddy
2. Go to "My Products" → Domains
3. Click on pbg.social
4. Click "DNS" or "Manage DNS"
5. Add the records above

### Phase 3: Deploy Backend to VPS

**Once VPS is ready, I'll run these commands:**

```bash
# SSH into VPS
ssh root@[VPS_IP]

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/ArandMedia/PBG.git
cd PBG

# Configure environment
nano .env.production
# Fill in:
# - Database password
# - Redis password
# - JWT secrets

# Deploy
./scripts/deploy-production.sh

# Setup SSL for api.pbg.social
./scripts/setup-ssl.sh
```

**This will give you:**
- Backend API at: https://api.pbg.social
- API Docs at: https://api.pbg.social/api/docs
- Health check at: https://api.pbg.social/api/v1/health

### Phase 4: Build Web App

**I'll build the web app locally:**

```bash
cd mobile
npm install
npm run build:web:prod
```

This creates static files in `mobile/dist/` folder.

### Phase 5: Deploy Web App to GoDaddy via FTP

**Using your FTP credentials:**
```
Host: 72.167.211.68 (or ftp.pbg.social)
Username: SEC_8576635@arandmedia.com
Password: zyfkyw-cimniX-2migko!
```

**Steps:**
1. Connect via FTP (I'll use FileZilla or command line)
2. Navigate to `public_html` folder (or domain-specific folder)
3. Upload contents of `mobile/dist/` folder
4. Set up `.htaccess` for React routing

**The .htaccess file I'll create:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable HTTPS
<IfModule mod_rewrite.c>
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### Phase 6: Configure SSL in cPanel

**Check if SSL covers api.pbg.social:**

1. Log into cPanel
2. Go to "SSL/TLS Status"
3. Check if `pbg.social` and `*.pbg.social` are covered
4. If wildcard: api.pbg.social is automatically covered ✅
5. If not: We'll use Let's Encrypt on VPS (already configured)

### Phase 7: Update Web App Configuration

**Before building web app, update API URL:**

File: `mobile/.env.production`
```env
API_URL=https://api.pbg.social/api/v1
WS_URL=wss://api.pbg.social
ENVIRONMENT=production
```

## Timeline

**Total deployment time: 2-3 hours**

- [ ] Set up VPS (30 min) - **You do this** or give me access
- [ ] Configure DNS (10 min) - **You do this** or give me access
- [ ] Deploy backend to VPS (30 min) - **I do this**
- [ ] Build web app (10 min) - **I do this**
- [ ] Upload to GoDaddy via FTP (20 min) - **I do this**
- [ ] Test everything (20 min) - **We do together**
- [ ] Go live! (10 min) - **Done!**

## What I Need from You

### Immediate:

**Option A: You set up VPS**
1. Create DigitalOcean or Vultr account
2. Deploy Ubuntu 22.04 VPS
3. Share VPS IP and root password with me
4. I'll handle the rest

**Option B: I guide you through VPS setup**
1. You share screen (Zoom/Google Meet)
2. I guide you step-by-step
3. We set it up together

### DNS Records:

**Either:**
- You add the DNS records (I'll provide exact instructions)
- OR give me GoDaddy account access to add them

### FTP Access (already have):
```
Host: 72.167.211.68
User: SEC_8576635@arandmedia.com
Pass: zyfkyw-cimniX-2migko!
```

## Cost Breakdown

**GoDaddy (current):**
- WordPress Hosting: Already paid ✅
- Domain: Already paid ✅
- SSL: Included ✅

**New VPS (for backend API):**
- DigitalOcean: $12/month (2GB RAM) - Recommended
- OR Vultr: $6/month (1GB RAM) - Budget option
- OR Linode: $10/month (2GB RAM)

**Total NEW cost: $6-12/month**

## Alternative: Use Only GoDaddy (Not Recommended)

If you want to avoid VPS costs, we could:
1. Deploy a PHP-based backend (requires rewriting the entire backend)
2. Use GoDaddy's Node.js hosting (if available, needs checking)
3. Use serverless functions (AWS Lambda, Vercel) for backend

**But this would require significant code changes and is not ideal.**

**Recommendation: Use the hybrid approach (web on GoDaddy, API on VPS) - it's the cleanest solution.**

## Next Steps

**Choose your path:**

### Path 1: Full Service (Fastest)
- Give me VPS credentials once you create it
- Give me GoDaddy DNS access (or add records yourself)
- I deploy everything
- Live in 2-3 hours

### Path 2: Guided Setup
- We schedule a call
- I guide you through each step
- You execute commands
- We go live together

### Path 3: You Deploy, I Support
- I provide step-by-step commands
- You execute them on VPS and GoDaddy
- I help troubleshoot
- Takes longer but you learn the process

**Which path do you prefer?**

## Security Note

After deployment, we'll:
- Change all passwords
- Set up automatic backups
- Enable firewall on VPS
- Set up monitoring
- Remove my access (if you want)

---

**Ready to proceed?**

Let me know:
1. Which VPS provider you want to use (DigitalOcean, Vultr, Linode)
2. Which deployment path you prefer (Full Service, Guided, or You Deploy)
3. If you want me to add DNS records or you'll do it

Then we'll get started! 🚀
