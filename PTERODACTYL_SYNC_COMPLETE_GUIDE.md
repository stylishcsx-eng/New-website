# 🎮 Complete Pterodactyl Sync Setup Guide

## 📦 What You Have

4 scripts to sync your CS 1.6 server data to the website:

1. **stats_sync.py** - Sync player rankings from csstats.dat
2. **import_bans.py** - Import existing bans from log files
3. **autoban.sh** - Real-time ban monitoring (watches logs)
4. **clear_data.py** - Clear test data from database (optional)

---

## 📁 Your Server Paths

**Pterodactyl Volume:** `d8109667-ac86-4f43-aeb3-5e84ed58df07`

**Full Paths:**
- Player Stats: `/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat`
- Ban Logs: `/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs/BAN_HISTORY_*.log`

---

## 🚀 Part 1: Upload Scripts to Pterodactyl Server

### Step 1: Download Updated Scripts

From this server, download these 3 files:
- `/app/pterodactyl-sync-scripts/UPDATED_stats_sync.py`
- `/app/pterodactyl-sync-scripts/UPDATED_import_bans.py`
- `/app/pterodactyl-sync-scripts/UPDATED_autoban.sh`

### Step 2: Upload to Pterodactyl Server via PuTTY

```bash
# Connect to your Pterodactyl server via PuTTY

# Create directory for scripts
mkdir -p /home/shadowzm-scripts
cd /home/shadowzm-scripts

# Upload files using WinSCP/FileZilla to /home/shadowzm-scripts/
# Or use nano to create them:
```

#### Create stats_sync.py:
```bash
nano /home/shadowzm-scripts/stats_sync.py
```
(Paste content from UPDATED_stats_sync.py, then Ctrl+X, Y, Enter)

#### Create import_bans.py:
```bash
nano /home/shadowzm-scripts/import_bans.py
```
(Paste content from UPDATED_import_bans.py, then Ctrl+X, Y, Enter)

#### Create autoban.sh:
```bash
nano /home/shadowzm-scripts/autoban.sh
```
(Paste content from UPDATED_autoban.sh, then Ctrl+X, Y, Enter)

### Step 3: Update Website URL in Scripts

**IMPORTANT:** Replace `YOUR_VPS_IP` with your actual VPS IP or domain!

```bash
cd /home/shadowzm-scripts

# Edit each script and change YOUR_VPS_IP
nano stats_sync.py
# Find line: WEBSITE_URL = \"http://YOUR_VPS_IP\"
# Change to: WEBSITE_URL = \"http://82.22.174.126\" (your actual VPS IP)
# Or: WEBSITE_URL = \"http://yourdomain.com\" (if you have domain)

nano import_bans.py
# Same change

nano autoban.sh
# Same change

# Make scripts executable
chmod +x stats_sync.py import_bans.py autoban.sh
```

---

## 🔧 Part 2: Install Dependencies on Pterodactyl Server

```bash
# Install Python requests library (for API calls)
pip3 install requests

# Or if pip3 doesn't work:
python3 -m pip install requests

# Test Python is working
python3 --version
```

---

## ✅ Part 3: Test Scripts Manually

### Test 1: Player Stats Sync

```bash
cd /home/shadowzm-scripts

# Run stats sync
python3 stats_sync.py

# Expected output:
# ==================================================
# CSStats Sync Tool for shadowzm
# ==================================================
# Reading: /var/lib/pterodactyl/volumes/d8109667.../csstats.dat
# File size: XXXX bytes
# Found: PlayerName (STEAM_ID) - K:100 D:50 HS:30
# ...
# ✓ Synced: PlayerName
# ==================================================
# Sync Complete!
#   Synced: 10
#   Failed: 0
# ==================================================
```

**If you get errors:**
- "File not found" → Check path is correct
- "Connection refused" → Check WEBSITE_URL is correct
- "HTTP 401" → Check SECRET matches backend

### Test 2: Ban Import

```bash
cd /home/shadowzm-scripts

# Run ban import
python3 import_bans.py

# Expected output:
# === Advanced Bans Import Tool ===
# Looking for logs in: /var/lib/pterodactyl/volumes/...
# Found 1 log file(s)
# Parsing: .../BAN_HISTORY_XXXXXXXX.log
# Found X ban entries
# Active bans to sync: X
# ✓ PlayerName (STEAM_ID): Success
# === Complete ===
# Synced: X
# Failed: 0
```

---

## 🔄 Part 4: Setup Automatic Syncing (Cron Jobs)

### Option A: Cron Jobs (Recommended)

```bash
# Edit crontab
crontab -e

# Add these lines (paste at the end):

# Sync player stats every 5 minutes
*/5 * * * * /usr/bin/python3 /home/shadowzm-scripts/stats_sync.py >> /home/shadowzm-scripts/stats_sync.log 2>&1

# Sync bans every 10 minutes
*/10 * * * * /usr/bin/python3 /home/shadowzm-scripts/import_bans.py >> /home/shadowzm-scripts/import_bans.log 2>&1

# Save and exit (Ctrl+X, Y, Enter)
```

**Verify cron jobs:**
```bash
# List cron jobs
crontab -l

# Should show your 2 cron jobs

# Wait 5-10 minutes, then check logs
tail -f /home/shadowzm-scripts/stats_sync.log
tail -f /home/shadowzm-scripts/import_bans.log
```

### Option B: Real-Time Ban Monitoring (Optional)

For instant ban syncing (instead of every 10 minutes):

```bash
cd /home/shadowzm-scripts

# Run in background with screen
screen -S autoban
bash autoban.sh

# Press Ctrl+A then D to detach
# It will keep running in background

# To check it later:
screen -r autoban
```

Or run as a service:
```bash
# Create systemd service
sudo nano /etc/systemd/system/shadowzm-autoban.service
```

Paste:
```ini
[Unit]
Description=ShadowZM Auto Ban Sync
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/shadowzm-scripts
ExecStart=/bin/bash /home/shadowzm-scripts/autoban.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable shadowzm-autoban
sudo systemctl start shadowzm-autoban

# Check status
sudo systemctl status shadowzm-autoban

# View logs
journalctl -u shadowzm-autoban -f
```

---

## 🎯 Part 5: Verify Everything Works

### Check Website Rankings

1. Open your website: `http://YOUR_VPS_IP`
2. Go to **Rankings** page
3. You should see players with stats!

### Check Website Banlist

1. Go to **Banlist** page
2. You should see active bans!

### Check API Directly

```bash
# On Pterodactyl server or your computer
curl http://YOUR_VPS_IP/api/rankings/top

# Should return JSON with player data

curl http://YOUR_VPS_IP/api/bans

# Should return JSON with ban data
```

---

## 📊 Sync Schedule Summary

**With Cron Jobs:**
- Player stats sync: **Every 5 minutes**
- Bans sync: **Every 10 minutes**

**With autoban.sh (real-time):**
- New bans appear **instantly** on website
- Unbans update **instantly**

**Recommendation:** Use both!
- Cron for regular stats updates
- autoban.sh for instant ban notifications

---

## 🛠️ Troubleshooting

### Issue 1: "File not found"

```bash
# Check if files exist
ls -la /var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat

ls -la /var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs/BAN_HISTORY_*.log

# If not found, check your volume ID is correct
ls /var/lib/pterodactyl/volumes/
```

### Issue 2: "Connection refused"

```bash
# Test if website is reachable from Pterodactyl server
curl http://YOUR_VPS_IP/api/

# Should return: {"message":"shadowzm: Zombie reverse API"...}

# If fails, check:
# 1. VPS IP is correct
# 2. Firewall allows connections
# 3. Backend is running
```

### Issue 3: "HTTP 401" or "Invalid secret"

```bash
# Check SECRET matches in both places:

# 1. Script secret
grep SECRET /home/shadowzm-scripts/stats_sync.py
# Should show: SECRET = "shadowzm-ban-secret-2024"

# 2. Backend secret (on VPS)
cat /var/www/shadowzm/backend/.env | grep BAN_WEBHOOK_SECRET
# Should show: BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024

# They must match exactly!
```

### Issue 4: Cron not running

```bash
# Check cron service
sudo systemctl status cron

# If not running:
sudo systemctl start cron

# Check cron logs
grep CRON /var/log/syslog | tail -20

# Make sure script paths are absolute (full paths)
```

### Issue 5: No player stats showing

```bash
# Check if csstats.dat has data
ls -lh /var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat

# If file is 0 bytes or very small, no stats yet
# Players need to play on server first!

# Force a manual sync
cd /home/shadowzm-scripts
python3 stats_sync.py
```

---

## 📋 Quick Reference

### Manual Sync Commands

```bash
cd /home/shadowzm-scripts

# Sync player stats
python3 stats_sync.py

# Sync bans
python3 import_bans.py

# Start real-time ban monitor
bash autoban.sh
```

### Check Cron Logs

```bash
# Stats sync log
tail -f /home/shadowzm-scripts/stats_sync.log

# Ban import log
tail -f /home/shadowzm-scripts/import_bans.log
```

### Test API from Pterodactyl

```bash
# Test stats webhook
curl -X POST "http://YOUR_VPS_IP/api/players/webhook" \
  -H "Content-Type: application/json" \
  -d '{\"secret\":\"shadowzm-ban-secret-2024\",\"nickname\":\"Test\",\"steamid\":\"STEAM_0:1:123\",\"kills\":100,\"deaths\":50,\"headshots\":30}'

# Test ban webhook
curl -X POST \"http://YOUR_VPS_IP/api/bans/webhook\" \
  -H \"Content-Type: application/json\" \
  -d '{\"secret\":\"shadowzm-ban-secret-2024\",\"player_nickname\":\"TestBan\",\"steamid\":\"STEAM_0:1:999\",\"reason\":\"Testing\",\"admin_name\":\"Admin\",\"duration\":\"Permanent\"}'
```

---

## 🎉 Complete Setup Checklist

- [ ] Downloaded updated scripts from this server
- [ ] Uploaded to Pterodactyl server at `/home/shadowzm-scripts/`
- [ ] Updated `WEBSITE_URL` in all 3 scripts
- [ ] Made scripts executable: `chmod +x *.py *.sh`
- [ ] Installed Python requests: `pip3 install requests`
- [ ] Tested stats_sync.py manually - Works!
- [ ] Tested import_bans.py manually - Works!
- [ ] Set up cron jobs for automatic syncing
- [ ] (Optional) Set up autoban.sh for real-time bans
- [ ] Verified data shows on website rankings page
- [ ] Verified bans show on website banlist page

---

## 📱 What Happens Now

**Every 5 minutes:**
- Player stats automatically sync to website
- Rankings page updates with latest kills/deaths

**Every 10 minutes:**
- Bans automatically sync to website
- Banlist page updates with active bans

**Real-time (if using autoban.sh):**
- New bans appear instantly on website
- Unbans update instantly

**Your website now shows:**
- ✅ Live CS 1.6 server status
- ✅ Real player rankings from your server
- ✅ Active ban list from your server
- ✅ Auto-updated every few minutes!

---

**Your CS 1.6 server is now fully connected to your website! 🎮✨**
