#!/usr/bin/env python3
"""
ShadowZM Complete Data Sync Script
Syncs player stats from csstats.dat and bans from BAN_HISTORY logs to MongoDB
"""

import struct
import glob
import re
import os
import sys
import time
from datetime import datetime, timezone
from pymongo import MongoClient

# ============================================================
# CONFIGURATION - EDIT THESE PATHS FOR YOUR SERVER
# ============================================================

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "shadowzm_database"

# Your CS 1.6 Server Files - UPDATE THESE PATHS!
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/logs"

SYNC_INTERVAL = 30  # seconds

# ============================================================

def get_db():
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return client, client[DB_NAME]
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        return None, None


def parse_csstats(filepath):
    """Parse csstats.dat binary file"""
    if not os.path.exists(filepath):
        print(f"[WARN] Stats file not found: {filepath}")
        return []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except Exception as e:
        print(f"[ERROR] Failed to read stats file: {e}")
        return []
    
    if len(data) < 10:
        return []
    
    players = []
    offset = 2  # Skip header
    
    while offset < len(data) - 10:
        try:
            # Read name
            if offset + 2 > len(data):
                break
            name_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            if name_len == 0 or name_len > 64:
                break
            if offset + name_len > len(data):
                break
            name = data[offset:offset+name_len].rstrip(b'\x00').decode('utf-8', errors='ignore')
            offset += name_len
            
            # Read steamid
            if offset + 2 > len(data):
                break
            steamid_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            if steamid_len == 0 or steamid_len > 64:
                break
            if offset + steamid_len > len(data):
                break
            steamid = data[offset:offset+steamid_len].rstrip(b'\x00').decode('utf-8', errors='ignore')
            offset += steamid_len
            
            # Read stats (7 integers)
            if offset + 28 > len(data):
                break
            stats = struct.unpack('<7i', data[offset:offset+28])
            offset += 28
            
            tks, damage, deaths, kills, shots, hits, headshots = stats
            
            if kills < 0 or deaths < 0 or not steamid:
                continue
            
            kd_ratio = round(kills / deaths, 2) if deaths > 0 else float(kills)
            
            players.append({
                'nickname': name,
                'steamid': steamid,
                'kills': max(0, kills),
                'deaths': max(0, deaths),
                'headshots': max(0, headshots),
                'kd_ratio': kd_ratio,
                'level': min(50, kills // 500),
            })
        except:
            break
    
    # Sort and rank
    players.sort(key=lambda x: x['kills'], reverse=True)
    for i, p in enumerate(players):
        p['rank'] = i + 1
        p['id'] = p['steamid']
        p['last_seen'] = datetime.now(timezone.utc).isoformat()
    
    return players


def parse_ban_logs(log_dir):
    """Parse BAN_HISTORY log files"""
    if not os.path.exists(log_dir):
        print(f"[WARN] Ban logs dir not found: {log_dir}")
        return []
    
    log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
    if not log_files:
        return []
    
    # Track latest action per player
    player_status = {}
    
    for log_file in sorted(log_files):
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban
                    if 'unbanned' in line or 'Ban time is up' in line:
                        unban_match = re.search(r'unbanned .+? <([^>]+)>', line)
                        if unban_match:
                            player_status[unban_match.group(1)] = {'action': 'unban'}
                        
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            player_status[expire_match.group(1)] = {'action': 'unban'}
                    
                    # Check for ban
                    elif 'banned' in line and '||' in line:
                        pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
                        match = re.match(pattern, line)
                        if match:
                            timestamp, admin, _, player, steamid, reason, duration = match.groups()
                            player_status[steamid.strip()] = {
                                'action': 'ban',
                                'data': {
                                    'id': f"{steamid.strip()}_{hash(timestamp)}",
                                    'player_nickname': player.strip(),
                                    'steamid': steamid.strip(),
                                    'ip': 'Hidden',
                                    'reason': reason.strip() or 'Banned',
                                    'admin_name': admin.strip(),
                                    'duration': duration.strip(),
                                    'ban_date': datetime.now(timezone.utc).isoformat()
                                }
                            }
        except Exception as e:
            print(f"[ERROR] Failed to read {log_file}: {e}")
    
    # Return only active bans
    return [v['data'] for v in player_status.values() if v['action'] == 'ban']


def sync_players(db, players):
    """Sync players to MongoDB"""
    if not players:
        return 0
    
    # Clear and re-insert for clean data
    db.players.delete_many({})
    
    for p in players:
        try:
            db.players.insert_one(p)
        except Exception as e:
            print(f"[ERROR] Failed to insert player {p['nickname']}: {e}")
    
    return len(players)


def sync_bans(db, bans):
    """Sync bans to MongoDB"""
    db.bans.delete_many({})
    
    if not bans:
        return 0
    
    for ban in bans:
        try:
            db.bans.insert_one(ban)
        except Exception as e:
            print(f"[ERROR] Failed to insert ban: {e}")
    
    return len(bans)


def run_sync_once():
    """Run sync once"""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Starting sync...")
    
    client, db = get_db()
    if db is None:
        return False
    
    players = parse_csstats(CSSTATS_FILE)
    p_count = sync_players(db, players)
    print(f"  ✓ Synced {p_count} players")
    
    bans = parse_ban_logs(BAN_LOGS_DIR)
    b_count = sync_bans(db, bans)
    print(f"  ✓ Synced {b_count} bans")
    
    client.close()
    return True


def run_continuous():
    """Run sync continuously"""
    print("="*50)
    print("  ShadowZM Data Sync - Continuous Mode")
    print("="*50)
    print(f"  Stats: {CSSTATS_FILE}")
    print(f"  Logs:  {BAN_LOGS_DIR}")
    print(f"  Interval: {SYNC_INTERVAL}s")
    print("="*50)
    print("\nPress Ctrl+C to stop\n")
    
    while True:
        try:
            run_sync_once()
            time.sleep(SYNC_INTERVAL)
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['--continuous', '-c']:
        run_continuous()
    else:
        run_sync_once()
