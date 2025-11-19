# GoDaddy Deployment Guide - PBG Social

Since you already have hosting, domain, and SSL through GoDaddy, we'll adapt the deployment to work with your existing infrastructure.

## Information Needed

### 1. Hosting Type

**What type of GoDaddy hosting do you have?**

- [ ] **VPS (Virtual Private Server)** - Best option, full control
- [ ] **Dedicated Server** - Also great, full control
- [ ] **Web Hosting Plus/Deluxe/Ultimate** - Limited, may need workarounds
- [ ] **WordPress Hosting** - Limited, may need separate VPS for backend

**How to check:** Log into GoDaddy → My Products → look at your hosting plan name

---

### 2. Server Access Information

#### If you have VPS or Dedicated Server:

**I need:**
```
Server IP: ___________________
SSH Username: ___________________
SSH Port: ___________________  (usually 22)
SSH Password or Private Key: (provide securely)
```

**OR** you can give me temporary access:
```bash
# Create a temporary user for me
sudo adduser claude
sudo usermod -aG sudo claude
sudo passwd claude  # Set temporary password

# Then share these credentials with me
```

#### If you have Shared/WordPress Hosting:

**I need:**
```
FTP/SFTP Host: ___________________
FTP Username: ___________________
FTP Password: ___________________
FTP Port: ___________________
cPanel URL: ___________________  (if available)
cPanel Username: ___________________
cPanel Password: ___________________
```

---

### 3. Domain Configuration

**Your domains:**
- Primary: `pbg.social` ✅ (you already have this)
- API subdomain: `api.pbg.social` (need to create)

**DNS Access:**
Either:
- GoDaddy DNS Manager credentials, OR
- I'll tell you exactly what DNS records to create

**What DNS records to add:**
```
Type: A Record
Name: @
Value: [Your server IP]
TTL: 600

Type: A Record
Name: api
Value: [Your server IP]
TTL: 600

Type: A Record
Name: www
Value: [Your server IP]
TTL: 600
```

---

### 4. SSL Certificate Information

**You mentioned you have SSL through GoDaddy. I need to know:**

- [ ] Is it a wildcard certificate (covers *.pbg.social)?
- [ ] Or individual certificates for pbg.social and api.pbg.social?
- [ ] Where are the certificate files located on your server?

**Certificate files I need:**
- `certificate.crt` (or fullchain.pem)
- `private.key` (or privkey.pem)
- `ca_bundle.crt` (if separate, or chain.pem)

**How to get them:**
- If on server: Tell me the file paths
- If in GoDaddy dashboard: Download and I'll tell you where to put them

---

### 5. Database Information (Optional)

**Do you have existing databases on GoDaddy?**

If yes:
```
MySQL Host: ___________________
MySQL Port: ___________________  (usually 3306)
Database Name: ___________________  (we can create new: pbg_production)
Database User: ___________________
Database Password: ___________________
```

If no: We'll create everything fresh (recommended)

---

## Deployment Paths Based on Your Hosting

### Path A: VPS/Dedicated Server (Recommended)

**If you have VPS or Dedicated, this is easy:**

1. I SSH into your server
2. Install Docker (if not installed)
3. Clone the PBG repository
4. Configure environment variables
5. Run deployment script
6. Point your existing SSL certificates
7. Done in ~30 minutes!

**Requirements:**
- Root or sudo access
- At least 4GB RAM
- Docker can be installed
- Ports 80 and 443 available

### Path B: Shared/WordPress Hosting

**If you have shared hosting, we have options:**

**Option B1: Deploy backend to separate VPS, frontend to GoDaddy**
- Backend API on cheap VPS ($5-10/month DigitalOcean/Vultr)
- Web app on your GoDaddy hosting (just static files)
- Best of both worlds

**Option B2: Full migration to VPS**
- Deploy entire PBG Social to new VPS
- Keep GoDaddy for domain/DNS only
- More control, better performance

**Option B3: Use GoDaddy VPS addon**
- Add VPS to your GoDaddy account
- Deploy everything there
- Keep everything in GoDaddy ecosystem

---

## Quick Setup Checklist

**Please provide:**

- [ ] Hosting type (VPS, Dedicated, Shared, WordPress)
- [ ] Server IP address
- [ ] SSH or FTP access credentials
- [ ] cPanel access (if available)
- [ ] SSL certificate files or locations
- [ ] Database credentials (if existing)

**I'll handle:**

- [ ] Server setup and configuration
- [ ] Docker installation (if needed)
- [ ] Application deployment
- [ ] SSL certificate installation
- [ ] DNS verification
- [ ] Testing and verification

---

## Secure Ways to Share Credentials

**Option 1: Create temporary access**
```bash
# On your server, create temp user valid for 7 days
sudo adduser claude-temp --expiredate $(date -d "+7 days" +%Y-%m-%d)
sudo usermod -aG sudo claude-temp
sudo passwd claude-temp

# Share via secure method
```

**Option 2: Use GoDaddy's delegation**
- GoDaddy allows you to grant temporary access to support/developers
- Go to Account Settings → Delegates → Add Delegate

**Option 3: Share securely via:**
- Password manager shared folder (1Password, LastPass)
- Encrypted message (keybase.io, Signal)
- Or I can provide you with my PGP public key

**Please don't share passwords in plain text chat!**

---

## What Happens Next

Once you provide the information above:

### Day 1 (1-2 hours):
1. I log into your server
2. Install necessary dependencies
3. Deploy backend API to api.pbg.social
4. Configure SSL certificates
5. Test API endpoints

### Day 1 (30 minutes):
6. Deploy web app to pbg.social
7. Configure Nginx/Apache
8. Test web app loads

### Day 1 (30 minutes):
9. Create admin account for you
10. Walk through testing
11. Verify everything works
12. Go live!

**Total time: 2-3 hours same day**

---

## Questions to Answer

**To get started, please answer these:**

1. **What GoDaddy hosting plan do you have?**
   - (Check in GoDaddy dashboard under "My Products")

2. **Do you have SSH access to your server?**
   - Yes → Great! Provide SSH details
   - No → What access do you have? (FTP, cPanel, etc.)

3. **Can you install software on your server?**
   - Yes → We can use Docker deployment
   - No → We'll use static file deployment

4. **Where is your SSL certificate?**
   - On server → Provide path
   - In GoDaddy dashboard → I'll guide you to download
   - Not installed yet → I'll help install

5. **What's your server IP address?**
   - (Found in GoDaddy hosting details)

6. **Do you want to:**
   - [ ] Use existing GoDaddy hosting for everything
   - [ ] Use GoDaddy for frontend, add cheap VPS for backend
   - [ ] Keep GoDaddy for domain/SSL only, deploy to VPS

---

## Next Steps

**Reply with:**
1. Your hosting type
2. How you'd like to proceed (use existing hosting or add VPS)
3. Your preferred method to share access credentials

Once I have this info, I'll provide exact deployment instructions tailored to your specific GoDaddy setup!

---

## Cost Considerations

**If using existing GoDaddy hosting:** $0 additional

**If adding VPS for better performance:**
- DigitalOcean: $6/month (1GB) or $12/month (2GB)
- Vultr: $6/month (1GB) or $12/month (2GB)
- Linode: $5/month (1GB) or $10/month (2GB)

**Recommendation:** If your current GoDaddy hosting is shared/WordPress, I recommend adding a $6-12/month VPS just for the backend API. Deploy the web app to your existing GoDaddy hosting (free).

This gives you:
- Fast, scalable backend
- Use existing GoDaddy hosting (already paid for)
- Total additional cost: $6-12/month
