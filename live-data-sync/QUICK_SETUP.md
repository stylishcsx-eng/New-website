# ShadowZM Data Sync - Quick Setup Guide

## Files Included
- `simple_sync.py` - The sync script (upload this to your VPS)
- `shadowzm-sync.service` - Systemd service file (optional, for automatic running)

---

## Step 1: Check Your MongoDB

First, let's verify MongoDB is running on your VPS:

```bash
# Check if MongoDB service is running
sudo systemctl status mongod

# If not running, start it:
sudo systemctl start mongod
sudo systemctl enable mongod

# Test MongoDB connection:
mongosh --eval "db.version()"
```

### Find Your MongoDB Connection String

Run this command:
```bash
mongosh --eval "db.getMongo()"
```

If MongoDB is running locally, your connection string is: `mongodb://localhost:27017`

---

## Step 2: Install Python Dependencies

```bash
pip3 install pymongo
```

---

## Step 3: Upload and Configure the Script

1. Upload `simple_sync.py` to your VPS (e.g., to `/root/simple_sync.py`)

2. Edit the configuration at the top of the file if needed:
```bash
nano /root/simple_sync.py
```

The important settings are:
```python
MONGO_URL = "mongodb://localhost:27017"  # Your MongoDB connection
DB_NAME = "shadowzm_database"            # Your database name
```

3. Make it executable:
```bash
chmod +x /root/simple_sync.py
```

---

## Step 4: Test the Script

Run the script once to test:
```bash
python3 /root/simple_sync.py
```

You should see output like:
```
============================================================
  ShadowZM - CS 1.6 Data Sync Script
============================================================

[STEP 1] Connecting to MongoDB...
  ✓ MongoDB connection successful!
  ✓ Using database: shadowzm_database

[STEP 2] Checking game files...
  ✓ Stats file found: /var/lib/pterodactyl/...
  ✓ Ban logs directory found: /var/lib/pterodactyl/...

[STEP 3] Parsing player stats...
  ✓ Parsed 150 players from stats file

...

  SYNC COMPLETE!
```

---

## Step 5: Run Continuously (Option A - Using systemd)

1. Copy the service file:
```bash
sudo cp /root/shadowzm-sync.service /etc/systemd/system/
```

2. Reload systemd and start:
```bash
sudo systemctl daemon-reload
sudo systemctl start shadowzm-sync
sudo systemctl enable shadowzm-sync
```

3. Check status:
```bash
sudo systemctl status shadowzm-sync
```

4. View logs:
```bash
tail -f /var/log/shadowzm-sync.log
```

---

## Step 5: Run Continuously (Option B - Using Screen)

If systemd gives you trouble, use screen instead:

```bash
# Install screen if needed
sudo apt install screen -y

# Start a new screen session
screen -S sync

# Run the script
python3 /root/simple_sync.py --continuous

# Detach from screen: Press Ctrl+A, then D
# Re-attach later: screen -r sync
```

---

## Troubleshooting

### "MongoDB connection FAILED"
1. Check MongoDB is running: `sudo systemctl status mongod`
2. Start MongoDB if stopped: `sudo systemctl start mongod`
3. Check MongoDB is listening: `sudo netstat -tlnp | grep 27017`

### "Stats file NOT FOUND"
1. Verify the path exists: `ls -la /var/lib/pterodactyl/volumes/YOUR-ID/cstrike/addons/amxmodx/data/`
2. Check permissions: `sudo chmod 644 /path/to/csstats.dat`

### "Permission denied"
Run the script as root: `sudo python3 /root/simple_sync.py`

### Script crashes after a while
Check the log file: `tail -100 /var/log/shadowzm-sync.log`

---

## Quick Commands Reference

```bash
# Test sync once
python3 /root/simple_sync.py

# Run continuously (foreground)
python3 /root/simple_sync.py --continuous

# Check service status
sudo systemctl status shadowzm-sync

# View sync logs
tail -f /var/log/shadowzm-sync.log

# Restart service
sudo systemctl restart shadowzm-sync

# Stop service
sudo systemctl stop shadowzm-sync
```
