# 🎮 Standalone CS 1.6 Stats API

## What This Does

A completely **standalone** REST API server that:
- ✅ Reads directly from CS 1.6 server files (no database!)
- ✅ Queries live server status via A2S protocol
- ✅ Parses csstats.dat for player rankings
- ✅ Parses BAN_HISTORY logs for active bans
- ✅ Provides REST API endpoints
- ✅ Works independently - no website dependency!

## Features

### 📊 Server Status
- Live server query (online/offline, map, players)
- Current player list with scores
- Real-time data via A2S protocol

### 🏆 Player Rankings
- Top players by kills
- Complete stats: K/D ratio, accuracy, headshots
- Search by SteamID
- Real-time reading from csstats.dat

### 🚫 Ban List
- Active bans from log files
- Automatically filters out unbanned players
- Ban details: reason, admin, duration
- Real-time reading from BAN_HISTORY logs

### 📈 Overall Statistics
- Total players, bans, kills, deaths
- Server status
- Top player info

---

## 🚀 Installation

### Step 1: Upload Files to Pterodactyl Server

```bash
# On your Pterodactyl server (via PuTTY)
mkdir -p /home/stats-api
cd /home/stats-api

# Upload server.py and requirements.txt here
```

### Step 2: Install Dependencies

```bash
cd /home/stats-api

# Install Python packages
pip3 install -r requirements.txt

# Or install manually:
pip3 install fastapi uvicorn python-a2s
```

### Step 3: Configure Paths

Edit `server.py` and update these lines:

```python
# Line 24-27
CS_SERVER_IP = "82.22.174.126"  # Your CS server IP
CS_SERVER_PORT = 27016          # Your CS server port

CSST ATS_FILE = "/var/lib/pterodactyl/volumes/YOUR_VOLUME/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/YOUR_VOLUME/cstrike/addons/amxmodx/logs"
```

Your volume is: `d8109667-ac86-4f43-aeb3-5e84ed58df07`

### Step 4: Test Run

```bash
cd /home/stats-api

# Run the server
python3 server.py

# Should see:
# Starting API server on http://0.0.0.0:8002
# API Documentation: http://localhost:8002/docs
```

Leave it running and test in another terminal:

```bash
# Test server status
curl http://localhost:8002/server-status

# Test rankings
curl http://localhost:8002/rankings/top

# Test bans
curl http://localhost:8002/bans
```

Press `Ctrl+C` to stop the test.

### Step 5: Run as Background Service

**Option A: Using PM2**

```bash
cd /home/stats-api

# Start with PM2
pm2 start "python3 server.py" --name cs-stats-api

# Save configuration
pm2 save

# Check status
pm2 status
```

**Option B: Using screen**

```bash
screen -S stats-api
cd /home/stats-api
python3 server.py

# Press Ctrl+A then D to detach
# To reattach: screen -r stats-api
```

**Option C: Using systemd (Recommended)**

```bash
# Create service file
sudo nano /etc/systemd/system/cs-stats-api.service
```

Paste:
```ini
[Unit]
Description=CS 1.6 Stats API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/stats-api
ExecStart=/usr/bin/python3 /home/stats-api/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cs-stats-api
sudo systemctl start cs-stats-api

# Check status
sudo systemctl status cs-stats-api

# View logs
journalctl -u cs-stats-api -f
```

---

## 📡 API Endpoints

### Base URL
```
http://YOUR_PTERODACTYL_IP:8002
```

### Endpoints

#### 1. API Info
```bash
GET /

Response:
{
  "name": "CS 1.6 Stats API",
  "version": "1.0.0",
  "endpoints": {...}
}
```

#### 2. Server Status
```bash
GET /server-status

Response:
{
  "online": true,
  "server_name": "ShadowZM : Zombie Reverse",
  "map": "de_dust2",
  "players": 5,
  "max_players": 32,
  "players_list": [
    {"name": "Player1", "score": 10, "duration": 123.45}
  ]
}
```

#### 3. Player Rankings
```bash
GET /rankings?limit=50
GET /rankings/top?limit=15

Response:
{
  "total": 150,
  "showing": 15,
  "players": [
    {
      "rank": 1,
      "nickname": "ProGamer",
      "steamid": "STEAM_0:1:123456",
      "kills": 1500,
      "deaths": 500,
      "headshots": 450,
      "kd_ratio": 3.0,
      "accuracy": 35.5
    }
  ]
}
```

#### 4. Player Stats by SteamID
```bash
GET /rankings/player/STEAM_0:1:123456

Response:
{
  "rank": 1,
  "nickname": "ProGamer",
  "kills": 1500,
  ...
}
```

#### 5. Active Bans
```bash
GET /bans

Response:
{
  "total": 10,
  "bans": [
    {
      "timestamp": "12/31/2025 - 20:00:00",
      "admin_name": "Admin",
      "player_nickname": "Cheater",
      "steamid": "STEAM_0:1:999999",
      "reason": "Wallhack",
      "duration": "Permanent"
    }
  ]
}
```

#### 6. Check Player Ban
```bash
GET /bans/STEAM_0:1:999999

Response:
{
  "banned": true,
  "ban_info": {...}
}
```

#### 7. Overall Statistics
```bash
GET /stats

Response:
{
  "server": {
    "online": true,
    "current_players": 5,
    "current_map": "de_dust2"
  },
  "statistics": {
    "total_players": 150,
    "total_bans": 10,
    "total_kills": 50000,
    "total_deaths": 45000
  },
  "top_player": {...}
}
```

#### 8. Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "server": "online",
  "stats_file": "found",
  "ban_logs": "found"
}
```

---

## 🌐 Access from Outside

### Open Firewall Port

```bash
# On Pterodactyl server
sudo ufw allow 8002/tcp

# Check firewall
sudo ufw status
```

### Access API

From anywhere:
```
http://YOUR_PTERODACTYL_IP:8002/server-status
http://YOUR_PTERODACTYL_IP:8002/rankings/top
http://YOUR_PTERODACTYL_IP:8002/bans
```

### API Documentation

Interactive docs:
```
http://YOUR_PTERODACTYL_IP:8002/docs
```

---

## 🔧 Configuration

Edit `server.py` lines 24-30:

```python
# CS Server Connection
CS_SERVER_IP = "82.22.174.126"  # Your CS server IP
CS_SERVER_PORT = 27016          # Your CS server port (default: 27015)

# File Paths (Pterodactyl volume)
CSST ATS_FILE = "/path/to/csstats.dat"
BAN_LOGS_DIR = "/path/to/logs/"
```

For your server:
```python
CSST ATS_FILE = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs"
```

---

## 🔍 Troubleshooting

### Issue: "Stats file not found"

```bash
# Check if file exists
ls -la /var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat

# If not found, verify volume ID
ls /var/lib/pterodactyl/volumes/
```

### Issue: "Can't query server"

```bash
# Test connection
ping 82.22.174.126

# Check CS server is running
# Make sure port 27016 is accessible
```

### Issue: "Port 8002 in use"

```bash
# Find what's using port
sudo lsof -i :8002

# Kill it or use different port
# Edit server.py line 215: port=8003
```

### View Logs

```bash
# If using systemd
journalctl -u cs-stats-api -f

# If using PM2
pm2 logs cs-stats-api

# If using screen
screen -r stats-api
```

---

## 💡 Use Cases

### 1. Direct API Access
Query the API directly from your applications:
```javascript
// JavaScript example
fetch('http://YOUR_IP:8002/rankings/top')
  .then(r => r.json())
  .then(data => console.log(data));
```

### 2. Website Integration
Integrate with your shadowzm.xyz website:
```javascript
// Call standalone API instead of website backend
const response = await fetch('http://YOUR_PTERODACTYL_IP:8002/server-status');
const data = await response.json();
```

### 3. Discord Bot
Create a Discord bot that shows server stats:
```python
import requests

stats = requests.get('http://YOUR_IP:8002/stats').json()
await ctx.send(f"Players online: {stats['server']['current_players']}")
```

### 4. Monitoring
Use health endpoint for monitoring:
```bash
#!/bin/bash
HEALTH=$(curl -s http://localhost:8002/health)
echo $HEALTH | grep '"status":"healthy"' || alert-admin
```

---

## ✅ Advantages

- ✅ **No Database** - Reads files directly
- ✅ **Real-time** - Always up-to-date
- ✅ **Independent** - Works standalone
- ✅ **Lightweight** - Minimal resources
- ✅ **Fast** - No database queries
- ✅ **Reliable** - Fewer dependencies
- ✅ **Easy** - Simple to deploy

---

## 🎯 Summary

This standalone API:
1. Runs on your Pterodactyl server
2. Reads CS 1.6 files directly
3. Provides REST API endpoints
4. Works 24/7 independently
5. No database needed
6. Real-time data

**Perfect for monitoring your CS server without website dependency!** 🎮
