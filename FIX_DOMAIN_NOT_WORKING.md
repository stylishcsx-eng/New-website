# 🌐 Domain Not Working - Complete Fix Guide

## Step 1: Check DNS Configuration

First, let's verify your domain is pointing to your VPS.

```bash
# Replace yourdomain.com with YOUR actual domain
nslookup yourdomain.com

# Or use dig
dig yourdomain.com +short

# Should show YOUR VPS IP address
```

**If DNS shows wrong IP or nothing:**
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Update DNS A record to point to your VPS IP
3. Wait 5-60 minutes for DNS propagation

---

## Step 2: Configure Nginx for Your Domain

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/shadowzm
```

**Update the `server_name` line to YOUR domain:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # CHANGE THIS!

    # Serve frontend build
    root /var/www/shadowzm/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Replace `yourdomain.com` with your actual domain!**

Then:
```bash
# Test nginx config
sudo nginx -t

# Should say "syntax is ok"

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## Step 3: Test Domain Access

```bash
# Test if domain resolves to your VPS
ping yourdomain.com

# Should show YOUR VPS IP

# Test if nginx responds
curl http://yourdomain.com

# Should return HTML
```

---

## Step 4: Rebuild Frontend with Domain URL

If you want the frontend to use your domain for API calls:

```bash
cd /var/www/shadowzm/frontend

# Update .env with your domain
echo "REACT_APP_BACKEND_URL=http://yourdomain.com" > .env

# Rebuild (takes 2-3 minutes)
npm install
npm run build

# Restart nginx
sudo systemctl reload nginx
```

**Or just use relative URLs** (recommended) - nginx will proxy `/api` automatically, so you don't need to change the frontend!

---

## 🚨 Common Issues & Fixes

### Issue 1: DNS Not Propagated Yet

**Symptom:** `nslookup yourdomain.com` shows wrong IP or nothing

**Fix:**
1. Log into your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
2. Go to DNS settings
3. Add/Update A record:
   - **Type:** A
   - **Name:** @ (or leave blank)
   - **Value:** YOUR_VPS_IP
   - **TTL:** 300 or Auto
4. Add/Update A record for www:
   - **Type:** A
   - **Name:** www
   - **Value:** YOUR_VPS_IP
   - **TTL:** 300 or Auto
5. Save and wait 5-60 minutes

**Check propagation:**
```bash
# Check if DNS updated
nslookup yourdomain.com

# Or use online tool
# Visit: https://dnschecker.org
# Enter your domain
```

---

### Issue 2: Nginx Default Server Conflict

**Symptom:** Domain loads nginx default page instead of your site

**Fix:**
```bash
# Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default

# Make sure your site is enabled
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

### Issue 3: Firewall Blocking

**Symptom:** Domain times out or connection refused

**Fix:**
```bash
# Check firewall status
sudo ufw status

# Should show:
# 80/tcp    ALLOW

# If not, enable it
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check if port 80 is listening
sudo netstat -tulpn | grep :80

# Should show nginx listening
```

---

### Issue 4: Multiple Server Blocks Conflict

**Symptom:** Wrong website loads

**Fix:**
```bash
# List enabled sites
ls -la /etc/nginx/sites-enabled/

# Should ONLY show: shadowzm

# Remove any other sites
sudo rm /etc/nginx/sites-enabled/other-site-name

# Restart nginx
sudo systemctl restart nginx
```

---

### Issue 5: Domain with WWW vs Non-WWW

**Solution:** Configure both in nginx:

```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Both!

    # ... rest of config
}
```

Or redirect www to non-www:
```nginx
server {
    listen 80;
    server_name www.yourdomain.com;
    return 301 http://yourdomain.com$request_uri;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    # ... your actual config
}
```

---

## 🔒 Optional: Add SSL (HTTPS)

Once domain works with HTTP, add SSL:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with YOUR domain!)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Certbot will automatically:
# 1. Get SSL certificate
# 2. Update nginx config
# 3. Set up auto-renewal

# Test auto-renewal
sudo certbot renew --dry-run

# Your site will now work with https://yourdomain.com
```

After SSL, update frontend .env:
```bash
cd /var/www/shadowzm/frontend
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env
npm run build
sudo systemctl reload nginx
```

---

## 📋 Complete Domain Setup Checklist

**1. DNS Configuration (at domain registrar):**
- [ ] A record: @ → YOUR_VPS_IP
- [ ] A record: www → YOUR_VPS_IP
- [ ] Wait 5-60 minutes for propagation

**2. Nginx Configuration:**
- [ ] Update `server_name` to your domain
- [ ] Remove default nginx site
- [ ] Test config: `sudo nginx -t`
- [ ] Restart nginx: `sudo systemctl restart nginx`

**3. Firewall:**
- [ ] Port 80 open: `sudo ufw allow 80/tcp`
- [ ] Port 443 open: `sudo ufw allow 443/tcp`

**4. Test:**
- [ ] DNS resolves: `nslookup yourdomain.com`
- [ ] Ping works: `ping yourdomain.com`
- [ ] Website loads: Open `http://yourdomain.com` in browser

**5. SSL (Optional but recommended):**
- [ ] Install certbot
- [ ] Run: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] Test renewal: `sudo certbot renew --dry-run`

---

## 🎯 Quick Fix Script

**Replace `YOURDOMAIN.COM` with your actual domain!**

```bash
#!/bin/bash
DOMAIN="YOURDOMAIN.COM"
VPS_IP=$(curl -s ifconfig.me)

echo "=== Domain Setup for $DOMAIN ==="

# 1. Check DNS
echo "1. Checking DNS..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -1)
if [ "$RESOLVED_IP" == "$VPS_IP" ]; then
    echo "✅ DNS correct: $DOMAIN → $VPS_IP"
else
    echo "❌ DNS issue: $DOMAIN → $RESOLVED_IP (should be $VPS_IP)"
    echo "Update your DNS A record at domain registrar!"
    exit 1
fi

# 2. Update nginx
echo "2. Updating nginx config..."
sudo sed -i "s/server_name .*/server_name $DOMAIN www.$DOMAIN;/" /etc/nginx/sites-available/shadowzm

# 3. Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test and restart nginx
sudo nginx -t && sudo systemctl restart nginx

# 5. Test domain
echo "3. Testing domain..."
curl -I http://$DOMAIN 2>&1 | head -1

echo "✅ Done! Try: http://$DOMAIN"
```

---

## 🔍 Diagnostic Commands

**Run these to debug:**

```bash
# 1. Check DNS
nslookup yourdomain.com
dig yourdomain.com +short

# 2. Check nginx config
sudo nginx -t
cat /etc/nginx/sites-enabled/shadowzm | grep server_name

# 3. Check nginx is running
sudo systemctl status nginx

# 4. Check firewall
sudo ufw status
sudo netstat -tulpn | grep :80

# 5. Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 6. Test from VPS
curl http://yourdomain.com

# 7. Check SSL (if using)
sudo certbot certificates
```

---

## 💡 What I Need From You

**To help you fix this, tell me:**

1. **Your domain name:** yourdomain.com
2. **Your VPS IP address:** x.x.x.x
3. **DNS check result:**
   ```bash
   nslookup yourdomain.com
   # Send me the output
   ```
4. **Nginx server_name:**
   ```bash
   cat /etc/nginx/sites-enabled/shadowzm | grep server_name
   # Send me the output
   ```
5. **What happens when you visit your domain in browser?**
   - Timeout?
   - Wrong page?
   - Nginx default page?
   - Nothing?

---

## 🚀 Most Common Fix

**99% of domain issues are DNS or nginx server_name:**

```bash
# 1. Make sure DNS points to VPS
nslookup yourdomain.com
# Should show your VPS IP

# 2. Update nginx
sudo nano /etc/nginx/sites-available/shadowzm
# Change: server_name yourdomain.com www.yourdomain.com;

# 3. Restart
sudo nginx -t
sudo systemctl restart nginx

# 4. Wait 5-10 minutes for DNS
# Then visit: http://yourdomain.com
```

**Send me your domain name and I'll help you debug specifically! 🌐**
