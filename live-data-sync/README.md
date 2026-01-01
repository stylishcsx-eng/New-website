# 🔄 Live CS 1.6 Data Sync to Website

## What This Does

This script reads **live data** directly from your CS 1.6 server files and updates your website's MongoDB database in real-time!

**Features:**
- ✅ Reads `csstats.dat` for player rankings
- ✅ Reads `BAN_HISTORY_*.log` for active bans
- ✅ Queries CS server for online/offline status
- ✅ Updates your website's MongoDB database
- ✅ Runs continuously or once
- ✅ Auto-filters unbanned players
- ✅ Shows live data on your website

---

## 🚀 Quick Setup

### Option A: Run on Your VPS (Recommended)

If MongoDB is on your VPS, run this script there:

```bash
# 1. Create directory
mkdir -p /root/live-data-sync
cd /root/live-data-sync

# 2. Upload sync_live_data.py here

# 3. Install dependencies
pip3 install motor pymongo python-a2s

# 4. Configure the script
nano sync_live_data.py
```

**Edit these lines (15-24):**
```python
# MongoDB (on VPS)
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "shadowzm_database"

# CS Server
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016

# File Paths (if files are on Pterodactyl, use SSH mount or API)
CSST ATS_FILE = "/path/to/csstats.dat"
BAN_LOGS_DIR = "/path/to/logs/"
```

### Option B: Run on Pterodactyl Server

If you run this on Pterodactyl where the files are:

```bash
# 1. Create directory
mkdir -p /home/live-data-sync
cd /home/live-data-sync

# 2. Upload sync_live_data.py

# 3. Install dependencies
pip3 install motor pymongo python-a2s

# 4. Configure
nano sync_live_data.py
```

**Edit these lines:**
```python
# MongoDB (connect to your VPS)
MONGO_URL = "mongodb://YOUR_VPS_IP:27017"
DB_NAME = "shadowzm_database"

# CS Server
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016

# File Paths (local on Pterodactyl)
CSST ATS_FILE = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs"
```

**Important:** If running on Pterodactyl, you need to allow MongoDB connections:
```bash
# On VPS, edit MongoDB config
sudo nano /etc/mongod.conf

# Find bindIp and change to:
bindIp: 0.0.0.0

# Restart MongoDB
sudo systemctl restart mongod

# Open firewall
sudo ufw allow 27017/tcp
```

---

## ▶️ Run the Script

### Run Once (Test)

```bash
cd /root/live-data-sync  # or /home/live-data-sync
python3 sync_live_data.py

# Choose: 1 (Once)

# Should see:
# ✅ MongoDB connected
# 🗑️  Clearing old data...
# 📊 Found X players in stats file
# 👥 Syncing X players...
# ✅ Synced X/X players
# 🚫 Found X active bans
# ✅ Synced X/X bans
# ✅ Sync complete!
```

### Run Continuously (Production)

```bash
python3 sync_live_data.py

# Choose: 2 (Continuous)

# Will sync every 60 seconds
# Press Ctrl+C to stop
```

---

## 🔄 Run as Background Service

### Using systemd (Recommended)

```bash
# Create service file
sudo nano /etc/systemd/system/cs-data-sync.service
```

Paste:
```ini
[Unit]
Description=CS 1.6 Live Data Sync
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/live-data-sync
ExecStart=/usr/bin/python3 /root/live-data-sync/sync_live_data.py
Restart=always
RestartSec=10
StandardInput=null
Environment="SYNC_MODE=continuous"

[Install]
WantedBy=multi-user.target
```

For continuous mode without prompt, edit script line 330:
```python
# Change:
mode = input("Run mode? (1) Once (2) Continuous [2]: ").strip() or "2"

# To:
mode = "2"  # Always continuous
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cs-data-sync
sudo systemctl start cs-data-sync

# Check status
sudo systemctl status cs-data-sync

# View logs
journalctl -u cs-data-sync -f
```

### Using PM2

```bash
cd /root/live-data-sync

# Modify script for non-interactive mode first
# Edit line 330: mode = "2"

pm2 start "python3 sync_live_data.py" --name cs-data-sync
pm2 save

# View logs
pm2 logs cs-data-sync
```

### Using screen

```bash
screen -S data-sync
cd /root/live-data-sync
python3 sync_live_data.py
# Choose: 2 (Continuous)

# Press Ctrl+A then D to detach
# To reattach: screen -r data-sync
```

---

## ✅ Verify It's Working

### Check MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to database
use shadowzm_database

# Check players
db.players.countDocuments()
db.players.find().limit(5).pretty()

# Check bans
db.bans.countDocuments()
db.bans.find().pretty()

# Exit
exit
```

### Check Website

1. Open your website: `http://YOUR_VPS_IP`
2. Go to **Rankings** page
3. Should see real players! ✅
4. Go to **Banlist** page
5. Should see real bans! ✅
6. Home page should show server status ✅

---

## ⚙️ Configuration Options

Edit `sync_live_data.py` lines 15-27:

### Sync Interval
```python
SYNC_INTERVAL = 60  # Seconds between syncs
```

Change to:
- `30` - Every 30 seconds (more frequent)
- `300` - Every 5 minutes (less frequent)
- `3600` - Every hour (minimal)

### Clear Old Data
```python
CLEAR_OLD_DATA = True  # Clear test data on first run
```

Set to `False` if you want to keep existing data.

### MongoDB Connection
```python
# Local MongoDB (script on VPS)
MONGO_URL = "mongodb://localhost:27017"

# Remote MongoDB (script on Pterodactyl)
MONGO_URL = "mongodb://YOUR_VPS_IP:27017"

# With authentication
MONGO_URL = "mongodb://username:password@YOUR_VPS_IP:27017"
```

---

## 🔍 Troubleshooting

### Error: "Stats file not found"

```bash
# Check if file exists
ls -la /var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat

# If not found, find correct path
find /var/lib/pterodactyl -name "csstats.dat" 2>/dev/null

# Update script with correct path
```

### Error: "MongoDB connection failed"

```bash
# Check MongoDB is running
sudo systemctl status mongod

# If not running
sudo systemctl start mongod

# Test connection
mongosh

# Check if MongoDB allows remote connections (if script on different server)
sudo nano /etc/mongod.conf
# bindIp: 0.0.0.0
sudo systemctl restart mongod
```

### Error: "Server query failed"

```bash
# This is OK - server might be offline
# Script will continue with other data

# To test CS server query manually:
python3 -c "import a2s; print(a2s.info(('82.22.174.126', 27016)))"
```

### No Data Showing on Website

```bash
# Check script is running
sudo systemctl status cs-data-sync
# or
pm2 status

# Check script logs
journalctl -u cs-data-sync -n 50
# or
pm2 logs cs-data-sync

# Check MongoDB has data
mongosh
use shadowzm_database
db.players.find().limit(5).pretty()

# Restart backend
pm2 restart shadowzm-backend

# Clear browser cache (Ctrl+Shift+R)
```

---

## 📊 What Gets Synced

### Players Collection

Each player document:
```json
{
  "nickname": "ProGamer",
  "steamid": "STEAM_0:1:123456",
  "kills": 1500,
  "deaths": 500,
  "headshots": 450,
  "kd_ratio": 3.0,
  "last_seen": ISODate("2025-01-01T00:00:00Z")
}
```

### Bans Collection

Each ban document:
```json
{
  "player_nickname": "Cheater",
  "steamid": "STEAM_0:1:999999",
  "reason": "Wallhack",
  "admin_name": "Admin",
  "duration": "Permanent",
  "ban_date": ISODate("2025-01-01T00:00:00Z")
}
```

### Server Status

Queried in real-time via A2S protocol.
Displayed on home page.

---

## 🎯 Sync Flow

```
CS 1.6 Server Files
    ↓
┌─────────────────────┐
│  csstats.dat        │ → Parse player stats
│  BAN_HISTORY_*.log  │ → Parse active bans
│  CS Server (A2S)    │ → Query server status
└─────────────────────┘
    ↓
┌─────────────────────┐
│  sync_live_data.py  │ → Process & sync
└─────────────────────┘
    ↓
┌─────────────────────┐
│  MongoDB            │ → Store in database
│  (shadowzm_database)│
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Website Backend    │ → Read from DB
│  (FastAPI)          │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Website Frontend   │ → Display to users
│  (React)            │
└─────────────────────┘
```

---

## ✅ Final Checklist

- [ ] Script uploaded to server
- [ ] Dependencies installed (`motor`, `pymongo`, `python-a2s`)
- [ ] Configuration updated (MongoDB URL, file paths)
- [ ] Tested with "Run Once" mode
- [ ] Data shows in MongoDB
- [ ] Data shows on website
- [ ] Running as service (systemd/PM2/screen)
- [ ] Backend restarted after first sync
- [ ] Browser cache cleared

---

## 🎉 Success!

Once running, your website will show:
- ✅ **Live player rankings** from csstats.dat
- ✅ **Active ban list** from BAN_HISTORY logs
- ✅ **Real-time server status** (online/offline)
- ✅ **Auto-updated every minute** (or your chosen interval)

**Your website now has LIVE data from your CS 1.6 server! 🎮**
