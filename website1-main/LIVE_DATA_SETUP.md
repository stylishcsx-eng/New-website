# shadowzm Live Data Setup Guide

## Step 1: Upload Scripts to VPS

Upload these files to `/home/` on your VPS using WinSCP or FileZilla:
- `clear_data.py` - Clears dummy data
- `stats_sync.py` - Syncs player rankings from csstats.dat
- `autoban.sh` - Auto-syncs bans when players get banned

---

## Step 2: Clear Dummy Data

Run this command on your VPS (PuTTY):

```bash
cd /home
python3 clear_data.py
```

Expected output:
```
=== Clearing dummy data ===
Cleared 3 bans
Cleared 15 players
=== Done! ===
```

---

## Step 3: Sync Player Rankings (One-Time)

This reads your csstats.dat and uploads player stats to the website:

```bash
cd /home
python3 stats_sync.py
```

If it shows "No players found", check if the file exists:
```bash
ls -la /var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/data/csstats.dat
```

---

## Step 4: Set Up Automatic Ban Sync

### 4.1 Install required tool:
```bash
sudo apt install inotify-tools -y
```

### 4.2 Make script executable:
```bash
chmod +x /home/autoban.sh
```

### 4.3 Test the script:
```bash
/home/autoban.sh
```

It will show "Watching for ban events..." - when someone gets banned in-game, it will auto-sync to the website.

### 4.4 Run in background (keeps running after you close PuTTY):
```bash
nohup /home/autoban.sh > /home/autoban.log 2>&1 &
```

### 4.5 Check if it's running:
```bash
ps aux | grep autoban
```

---

## Step 5: Schedule Automatic Stats Sync (Optional)

To sync player stats every hour, add a cron job:

```bash
crontab -e
```

Add this line at the bottom:
```
0 * * * * /usr/bin/python3 /home/stats_sync.py >> /home/stats_sync.log 2>&1
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Manual Ban Sync (Test)

To manually add a ban for testing:

```bash
curl -X POST "http://82.22.174.126:8085/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "Cheater123",
    "steamid": "STEAM_0:1:999999",
    "reason": "Wallhack",
    "admin_name": "Stylish",
    "duration": "Permanent"
  }'
```

---

## Manual Player Sync (Test)

To manually add a player for testing:

```bash
curl -X POST "http://82.22.174.126:8085/api/players/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "nickname": "TestPlayer",
    "steamid": "STEAM_0:1:123456",
    "kills": 500,
    "deaths": 200,
    "headshots": 150
  }'
```

---

## Troubleshooting

### "No players found in stats file"
- The csstats.dat file might be empty or in a different format
- Use manual player sync commands above to add players

### Autoban not detecting bans
- Check your AMX Mod X log format
- The script looks for lines containing "banned"
- You may need to adjust the patterns in autoban.sh

### Scripts not working
- Make sure Python3 and curl are installed
- Check file permissions: `chmod +x /home/*.sh`
