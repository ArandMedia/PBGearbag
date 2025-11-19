# GoDaddy cPanel Deployment Guide - $0 Cost!

Complete guide to deploy PBG Social to your GoDaddy hosting using cPanel Node.js and MySQL.

**Cost: $0 additional** (uses your existing GoDaddy hosting)

---

## Overview

We'll deploy:
- **Frontend (pbg.social)**: Static files via FTP
- **Backend (api.pbg.social)**: Node.js 24.6.0 app via cPanel
- **Database**: MySQL database in cPanel

---

## Prerequisites

✅ You have:
- GoDaddy WordPress hosting with cPanel access
- Node.js 24.6.0 available in cPanel ✅
- MySQL databases available in cPanel ✅
- SSH enabled ✅
- FTP access ✅
- SSL certificate (included with hosting) ✅

---

## Part 1: Database Setup (10 minutes)

### Step 1: Create MySQL Database

1. **Log into cPanel**
2. **Go to:** Databases → MySQL Databases
3. **Create New Database:**
   - Database Name: `pbg_production` (cPanel will prefix it, like `g2dyxj8r_pbg_production`)
   - Click "Create Database"
   - **Note the full database name** (with prefix)

### Step 2: Create MySQL User

1. **In same MySQL Databases page**
2. **Create New User:**
   - Username: `pbg_user`
   - Password: Generate strong password (use generator)
   - Click "Create User"
   - **Write down:**
     - Full username (with prefix, like `g2dyxj8r_pbg_user`)
     - Password

### Step 3: Add User to Database

1. **Scroll to "Add User To Database"**
2. **Select:**
   - User: `g2dyxj8r_pbg_user` (your user)
   - Database: `g2dyxj8r_pbg_production` (your database)
3. **Click "Add"**
4. **Grant ALL PRIVILEGES**
5. **Click "Make Changes"**

### Step 4: Note Your Database Credentials

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=g2dyxj8r_pbg_user (your actual prefixed username)
DB_PASSWORD=<the password you generated>
DB_DATABASE=g2dyxj8r_pbg_production (your actual prefixed database name)
```

**Keep these safe - you'll need them!**

---

## Part 2: Prepare Application Files (20 minutes)

### Step 1: Clone Repository on Your Local Machine

```bash
# On your Mac
cd ~/Desktop
git clone https://github.com/ArandMedia/PBG.git
cd PBG
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Create Production Environment File

```bash
# Create .env file for production
nano .env
```

**Paste this (update with YOUR values):**

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database (MySQL - use YOUR credentials from Step 4 above)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=g2dyxj8r_pbg_user
DB_PASSWORD=your_mysql_password_here
DB_DATABASE=g2dyxj8r_pbg_production

# Redis (disable for cPanel - not available on shared hosting)
# REDIS_HOST=
# REDIS_PORT=

# JWT (generate these!)
JWT_SECRET=<run: openssl rand -base64 64>
REFRESH_TOKEN_SECRET=<run: openssl rand -base64 64>
JWT_EXPIRATION=7d
REFRESH_TOKEN_EXPIRATION=30d

# Frontend URL
FRONTEND_URL=https://pbg.social

# AWS S3 (optional - for now, files stored locally)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Stripe (for future features)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@pbg.social

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

**Generate JWT secrets:**
```bash
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for REFRESH_TOKEN_SECRET
```

Save the file (`Ctrl+X`, `Y`, `Enter`)

### Step 4: Build Backend

```bash
# Still in backend folder
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

---

## Part 3: Upload Backend to cPanel (15 minutes)

### Step 1: Upload Files via FTP

**Use FileZilla, Cyberduck, or command line:**

**FTP Credentials:**
```
Host: 72.167.211.68 (or ftp.pbg.social)
Username: SEC_8576635@arandmedia.com
Password: zyfkyw-cimniX-2migko!
Port: 21
```

**What to upload:**
1. Create folder: `/home/g2dyxj8rsnqr/pbg-api/`
2. Upload these files/folders:
   - `dist/` folder (entire folder)
   - `node_modules/` folder (entire folder)
   - `package.json`
   - `package-lock.json`
   - `.env` (the one you just created)

**Upload location:**
```
/home/g2dyxj8rsnqr/pbg-api/
├── dist/
├── node_modules/
├── package.json
├── package-lock.json
└── .env
```

---

## Part 4: Setup Node.js App in cPanel (10 minutes)

### Step 1: Create Node.js Application

1. **Log into cPanel**
2. **Go to:** Software → Setup Node.js App
3. **Click "Create Application"**

**Fill in:**
```
Node.js version: 24.6.0
Application mode: Production
Application root: /home/g2dyxj8rsnqr/pbg-api
Application URL: Choose subdomain "api" → api.pbg.social
Application startup file: dist/main.js
Passenger log file: /home/g2dyxj8rsnqr/logs/pbg-api.log
```

4. **Click "Create"**

### Step 2: Set Environment Variables

In the same Node.js App page:

1. **Scroll to "Environment Variables"**
2. **Add each variable from your `.env` file**

Click "Add Variable" for each:
```
NODE_ENV = production
PORT = 3000
DB_HOST = localhost
DB_PORT = 3306
DB_USERNAME = g2dyxj8r_pbg_user
DB_PASSWORD = your_password
DB_DATABASE = g2dyxj8r_pbg_production
JWT_SECRET = your_generated_secret
REFRESH_TOKEN_SECRET = your_generated_secret
FRONTEND_URL = https://pbg.social
... (add all the rest)
```

### Step 3: Install Dependencies via SSH

**SSH into your server:**
```bash
ssh g2dyxj8rsnqr@72.167.211.68
# Password: zyfkyw-cimniX-2migko!
```

**Navigate to app folder:**
```bash
cd ~/pbg-api

# Verify files are there
ls -la

# Install production dependencies
npm ci --production

# Run database migrations
npm run typeorm migration:run
```

###Step 4: Start the Application

**Back in cPanel → Setup Node.js App:**

1. **Find your pbg-api application**
2. **Click "Start App" or "Restart"**
3. **Wait 30 seconds**
4. **Check status** - should show "Running"

### Step 5: Test API

**Open browser:**
```
https://api.pbg.social/api/v1/health
```

**Should return:**
```json
{"status":"ok"}
```

**Test API docs:**
```
https://api.pbg.social/api/docs
```

**If you get errors:**
- Check logs: `/home/g2dyxj8rsnqr/logs/pbg-api.log`
- Via cPanel: Click "Run NPM Install" button
- Via SSH: `pm2 logs` or check cPanel Node.js app status

---

## Part 5: Deploy Frontend (10 minutes)

### Step 1: Build Web App

**On your local machine:**

```bash
# Navigate to mobile folder
cd ~/Desktop/PBG/mobile

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Paste:**
```env
API_URL=https://api.pbg.social/api/v1
WS_URL=wss://api.pbg.social
ENVIRONMENT=production
ENABLE_STREAMING=false
ENABLE_MARKETPLACE=true
ENABLE_ANALYTICS=false
```

**Build for web:**
```bash
npm run build:web:prod
```

This creates `dist/` folder with static files.

### Step 2: Upload to GoDaddy

**Via FTP (same credentials as before):**

**Upload location:**
```
/home/g2dyxj8rsnqr/public_html/
```

**Upload all contents of `mobile/dist/` to:**
- If pbg.social is your main domain: `/home/g2dyxj8rsnqr/public_html/`
- If pbg.social is an addon domain: `/home/g2dyxj8rsnqr/public_html/pbg.social/`

**Files to upload:**
- `index.html`
- `asset-manifest.json`
- `manifest.json`
- `static/` folder (all contents)
- `assets/` folder (all contents)

### Step 3: Create .htaccess for React Router

**In the same public_html folder, create `.htaccess`:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
</IfModule>
```

### Step 4: Test Web App

**Open browser:**
```
https://pbg.social
```

Should see the PBG Social app load!

---

## Part 6: DNS Configuration (if needed)

**If api.pbg.social doesn't work:**

1. **Log into GoDaddy**
2. **Go to:** My Products → Domains → pbg.social → DNS
3. **Add A Record:**
   ```
   Type: A
   Name: api
   Value: 72.167.211.68
   TTL: 600
   ```
4. **Wait 5-10 minutes** for DNS to propagate

---

## Part 7: SSL Configuration

Your GoDaddy hosting includes SSL. To verify:

1. **cPanel → Security → SSL/TLS Status**
2. **Check:** pbg.social and api.pbg.social should both show "Secure"
3. **If not secure:**
   - Click "Run AutoSSL"
   - Wait 5 minutes
   - Check again

---

## Troubleshooting

### Backend API Not Working

**Check logs:**
```bash
ssh g2dyxj8rsnqr@72.167.211.68
cat ~/logs/pbg-api.log
```

**Common issues:**

**1. Database connection error:**
- Verify database credentials in cPanel environment variables
- Check database user has all privileges
- Test: `mysql -u g2dyxj8r_pbg_user -p g2dyxj8r_pbg_production`

**2. Module not found:**
```bash
cd ~/pbg-api
npm ci --production
```

**3. Permission errors:**
```bash
cd ~/pbg-api
chmod -R 755 dist/
```

**4. App won't start:**
- Check Passenger log: `/home/g2dyxj8rsnqr/logs/pbg-api.log`
- Restart app in cPanel
- Verify startup file is `dist/main.js`

### Frontend Not Loading

**1. Check files uploaded:**
```bash
ssh g2dyxj8rsnqr@72.167.211.68
ls -la ~/public_html/
```

Should see: `index.html`, `static/`, `assets/`

**2. Check .htaccess exists:**
```bash
cat ~/public_html/.htaccess
```

**3. Clear browser cache:**
- Hard refresh: `Cmd + Shift + R`

**4. Check API connection:**
- Open browser console (F12)
- Look for CORS errors
- Verify API URL is `https://api.pbg.social/api/v1`

### Database Errors

**Run migrations:**
```bash
ssh g2dyxj8rsnqr@72.167.211.68
cd ~/pbg-api
npm run typeorm migration:run
```

**Reset database (CAUTION - deletes all data):**
```sql
mysql -u g2dyxj8r_pbg_user -p
DROP DATABASE g2dyxj8r_pbg_production;
CREATE DATABASE g2dyxj8r_pbg_production;
exit;
npm run typeorm migration:run
```

---

## Performance Optimization

### 1. Enable cPanel Caching

**cPanel → Optimize Website:**
- Enable "Compress All Content"

### 2. Disable Redis References

Since Redis isn't available on shared hosting, the app uses in-memory caching.

**This is fine for starting out!** Performance will still be good.

### 3. Monitor Resource Usage

**cPanel → Metrics → Resource Usage**
- Check CPU and memory usage
- If you hit limits, consider upgrading hosting plan

---

## Updating the Application

### Update Backend:

```bash
# Local machine
cd ~/Desktop/PBG/backend
git pull
npm run build

# Upload new dist/ folder via FTP
# Then SSH:
ssh g2dyxj8rsnqr@72.167.211.68
cd ~/pbg-api
npm ci --production
npm run typeorm migration:run

# Restart via cPanel Node.js App page
```

### Update Frontend:

```bash
# Local machine
cd ~/Desktop/PBG/mobile
git pull
npm run build:web:prod

# Upload dist/ contents to public_html via FTP
# Clear browser cache and test
```

---

## Backup Strategy

### Database Backups:

**cPanel → Files → Backup:**
- Download MySQL database backup
- Do this weekly (or automate via cron)

**Via SSH:**
```bash
mysqldump -u g2dyxj8r_pbg_user -p g2dyxj8r_pbg_production > backup.sql
```

### File Backups:

**Backup these folders:**
- `/home/g2dyxj8rsnqr/pbg-api/` (backend)
- `/home/g2dyxj8rsnqr/public_html/` (frontend)
- `/home/g2dyxj8rsnqr/uploads/` (user uploads)

---

## What's Not Included (Shared Hosting Limitations)

### ❌ Redis Caching
- **Impact:** Slightly slower performance
- **Workaround:** App uses in-memory caching instead
- **When to add:** If you upgrade to VPS later

### ❌ WebSockets for Real-Time
- **Impact:** Real-time features (chat, notifications) won't work
- **Workaround:** Implement later with polling or upgrade to VPS
- **When to add:** When you need live features

### ❌ Background Jobs
- **Impact:** Email sending, image processing may be slower
- **Workaround:** Process inline (works fine for low traffic)
- **When to add:** When processing takes too long

---

## Next Steps After Deployment

1. **Create Admin Account:**
   ```bash
   # Register via web app first
   # Then SSH:
   ssh g2dyxj8rsnqr@72.167.211.68
   mysql -u g2dyxj8r_pbg_user -p g2dyxj8r_pbg_production
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

2. **Test Key Features:**
   - Register new account
   - Update profile
   - Create marketplace listing
   - Upload images
   - Search listings

3. **Monitor for 24 hours:**
   - Check error logs
   - Monitor cPanel resource usage
   - Test from different devices

4. **Set Up Analytics:**
   - Add Google Analytics
   - Monitor user signups
   - Track marketplace activity

---

## Cost Analysis

**Current Setup (GoDaddy only):**
- Hosting: Already paid ✅
- Domain: Already paid ✅
- SSL: Included ✅
- **Additional cost: $0/month** 🎉

**When to Consider VPS ($6-12/month):**
- Traffic exceeds cPanel limits
- Need real-time features (WebSockets)
- Need better performance
- Hit resource limits
- Need Redis caching

**You can always migrate later!**

---

## Support

**If you run into issues:**

1. **Check logs:** `/home/g2dyxj8rsnqr/logs/pbg-api.log`
2. **Test database:** Connect via MySQL and verify tables exist
3. **Check environment:** cPanel Node.js App → Environment Variables
4. **Restart app:** cPanel → Setup Node.js App → Restart

**Everything working?** Congratulations! 🎉

**Your PBG Social platform is live at:**
- Web App: https://pbg.social
- API: https://api.pbg.social
- API Docs: https://api.pbg.social/api/docs

**Total cost: $0 additional!** 💰
