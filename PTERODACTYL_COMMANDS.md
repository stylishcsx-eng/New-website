# 🎮 Commands for Your Pterodactyl Server (via PuTTY)

## IMPORTANT: Two Different Servers!

### 🌐 Emergent Website Server (Where your website runs)
- **Location:** https://frag-tracker.preview.emergentagent.com
- **You DON'T need PuTTY** - website has hot-reload, updates automatically
- **Managed by Emergent** - restarts happen automatically

### 🎮 Pterodactyl/Game Server (Your CS 1.6 server)
- **Location:** 82.22.174.126:27016
- **Access:** Via PuTTY SSH
- **What you run here:** stats_sync.py, import_bans.py, autoban.sh

---

## Commands for YOUR Pterodactyl Server (PuTTY)

### 📊 Sync Player Stats to Website

```bash
# Navigate to where your scripts are located
cd /home/container
# or wherever you put the scripts

# Run stats sync manually
python3 stats_sync.py

# Run ban import manually
python3 import_bans.py
```

### 🔄 Setup Automatic Sync (Cron Jobs)

```bash
# Edit crontab
crontab -e

# Add these lines to sync every 5 minutes:
*/5 * * * * cd /path/to/scripts && python3 stats_sync.py >> /tmp/stats_sync.log 2>&1
*/10 * * * * cd /path/to/scripts && python3 import_bans.py >> /tmp/bans_sync.log 2>&1

# Save and exit (Ctrl+X, then Y, then Enter)
```

### 📝 Check Sync Logs

```bash
# View stats sync log
tail -f /tmp/stats_sync.log

# View bans sync log
tail -f /tmp/bans_sync.log
```

### ✅ Test Connection to Website

```bash
# Test if website API is reachable from your server
curl -X POST "https://frag-tracker.preview.emergentagent.com/api/players/webhook" \
  -H "Content-Type: application/json" \
  -d '{"secret":"shadowzm-ban-secret-2024","nickname":"TestPlayer","steamid":"STEAM_0:1:123456","kills":100,"deaths":50,"headshots":30}'

# Expected output: {"message":"Player added","steamid":"STEAM_0:1:123456"}
```

### 🔧 Your Sync Scripts Configuration

**Update these lines in your scripts:**

**stats_sync.py:**
```python
WEBSITE_URL = "https://frag-tracker.preview.emergentagent.com"
SECRET = "shadowzm-ban-secret-2024"
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/data/csstats.dat"
```

**import_bans.py:**
```python
WEBSITE_URL = "https://frag-tracker.preview.emergentagent.com"
SECRET = "shadowzm-ban-secret-2024"
LOG_DIR = "/var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/logs"
```

### 🛠️ Common PuTTY Commands

```bash
# Check if Python is installed
python3 --version

# Check if scripts exist
ls -la /home/container/*.py

# Make scripts executable
chmod +x /home/container/stats_sync.py
chmod +x /home/container/import_bans.py

# Run script with full output
python3 /home/container/stats_sync.py

# Check if cron is running
ps aux | grep cron

# View active cron jobs
crontab -l
```

### 📍 Find Your CS 1.6 Files

```bash
# Find csstats.dat file
find /var/lib/pterodactyl -name "csstats.dat" 2>/dev/null

# Find ban logs
find /var/lib/pterodactyl -name "BAN_HISTORY*.log" 2>/dev/null

# List your server files
ls -la /var/lib/pterodactyl/volumes/*/cstrike/
```

### 🔍 Troubleshooting on Pterodactyl

```bash
# Check if curl is installed
curl --version

# Test internet connection
ping -c 3 google.com

# Check Python packages
pip3 list | grep requests

# Install requests if missing
pip3 install requests

# Test script with verbose output
python3 -u stats_sync.py
```

---

## 📱 Your Website (No PuTTY Needed!)

### The website automatically updates when you change code!

**Hot Reload is Active:**
- ✅ Edit React files → Changes appear in ~2-5 seconds
- ✅ Edit backend files → Changes appear in ~2-3 seconds
- ✅ Logo changes → Already live!

**You only need to manually restart IF:**
- Installing new packages (rare)
- Updating .env files (rare)
- Something crashes (very rare)

---

## 🎯 Summary

| Task | Where | Command |
|------|-------|---------|
| **Sync player stats** | Pterodactyl (PuTTY) | `python3 stats_sync.py` |
| **Sync bans** | Pterodactyl (PuTTY) | `python3 import_bans.py` |
| **View website** | Browser | Open: https://frag-tracker.preview.emergentagent.com |
| **Website changes** | Automatic | Hot reload - no commands needed! |
| **Check CS server** | Browser/Steam | connect 82.22.174.126:27016 |

---

## ✅ What You Need to Do on Pterodactyl:

1. **Upload the sync scripts** (stats_sync.py, import_bans.py)
2. **Update WEBSITE_URL** in both scripts to your Emergent URL
3. **Run them manually first** to test
4. **Setup cron jobs** to run automatically every 5-10 minutes
5. **Check logs** to make sure they're working

That's it! The website will automatically display the data once your scripts start sending it. 🎮
