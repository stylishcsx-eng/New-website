#!/usr/bin/env python3
"""
ShadowZM REAL-TIME Data Sync Script
====================================
- Watches ban logs for changes and syncs INSTANTLY
- Syncs player stats every 60 seconds
- Server status is already live on your website (queries server directly)

Usage:
    python3 realtime_sync.py
"""

import struct
import glob
import re
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from pymongo import MongoClient

# ============================================================
# CONFIGURATION
# ============================================================

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "shadowzm_database"

# Your CS 1.6 Server Files (Pterodactyl paths)
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/logs"

# Sync intervals
PLAYER_SYNC_INTERVAL = 60  # Sync players every 60 seconds
BAN_CHECK_INTERVAL = 5     # Check for new bans every 5 seconds

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_db():
    """Get MongoDB connection"""
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return client, client[DB_NAME]
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        return None, None


def get_ban_files_hash():
    """Get hash of all ban log files to detect changes"""
    log_files = sorted(glob.glob(f"{BAN_LOGS_DIR}/BAN_HISTORY_*.log"))
    if not log_files:
        return ""
    
    hash_content = ""
    for f in log_files:
        try:
            stat = os.stat(f)
            hash_content += f"{f}:{stat.st_size}:{stat.st_mtime};"
        except:
            pass
    
    return hashlib.md5(hash_content.encode()).hexdigest()


def parse_csstats(filepath):
    """Parse csstats.dat file"""
    if not os.path.exists(filepath):
        return []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except:
        return []
    
    if len(data) < 10:
        return []
    
    players = []
    offset = 2
    
    while offset < len(data) - 10:
        try:
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
            
            if offset + 28 > len(data):
                break
            
            stats = list(struct.unpack('<7i', data[offset:offset+28]))
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
                'rank': 0
            })
        except:
            break
    
    players.sort(key=lambda x: x['kills'], reverse=True)
    for i, p in enumerate(players):
        p['rank'] = i + 1
    
    return players


def parse_ban_logs(log_dir):
    """Parse ban history logs - tracks order of events to get CURRENT ban status"""
    if not os.path.exists(log_dir):
        return []
    
    log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
    if not log_files:
        return []
    
    # Track the LATEST action for each player (ban or unban)
    # Key: steamid, Value: {'action': 'ban'/'unban', 'data': ban_data or None}
    player_status = {}
    
    for log_file in sorted(log_files):
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban (ban expired or manually unbanned)
                    if 'unbanned' in line or 'Ban time is up' in line:
                        unban_match = re.search(r'unbanned .+? <([^>]+)>', line)
                        if unban_match:
                            steamid = unban_match.group(1)
                            player_status[steamid] = {'action': 'unban', 'data': None}
                        
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            steamid = expire_match.group(1)
                            player_status[steamid] = {'action': 'unban', 'data': None}
                    
                    # Check for ban
                    elif 'banned' in line and '||' in line:
                        pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
                        match = re.match(pattern, line)
                        if match:
                            timestamp_str, admin_name, admin_steam, player_name, player_steam, reason, duration = match.groups()
                            ban_data = {
                                'timestamp': timestamp_str,
                                'admin_name': admin_name.strip(),
                                'player_nickname': player_name.strip(),
                                'steamid': player_steam.strip(),
                                'reason': reason.strip() if reason.strip() else "Banned",
                                'duration': duration.strip()
                            }
                            player_status[player_steam.strip()] = {'action': 'ban', 'data': ban_data}
        except:
            continue
    
    # Get all players whose LATEST action was a ban
    active_bans = [v['data'] for v in player_status.values() if v['action'] == 'ban' and v['data'] is not None]
    return active_bans


def sync_players(db, players):
    """Sync players to database"""
    if not players:
        return 0
    
    synced = 0
    for player in players:
        try:
            player_data = {
                'nickname': player['nickname'],
                'steamid': player['steamid'],
                'kills': player['kills'],
                'deaths': player['deaths'],
                'headshots': player['headshots'],
                'kd_ratio': player['kd_ratio'],
                'level': player['level'],
                'rank': player['rank'],
                'last_seen': datetime.now(timezone.utc).isoformat()
            }
            
            db.players.update_one(
                {'steamid': player['steamid']},
                {'$set': player_data, '$setOnInsert': {'id': player['steamid']}},
                upsert=True
            )
            synced += 1
        except:
            pass
    
    return synced


def sync_bans(db, bans):
    """Sync bans to database"""
    try:
        db.bans.delete_many({})
    except:
        return 0
    
    if not bans:
        return 0
    
    synced = 0
    for ban in bans:
        try:
            ban_data = {
                'id': ban['steamid'] + '_' + str(hash(ban['timestamp']))[-6:],
                'player_nickname': ban['player_nickname'],
                'steamid': ban['steamid'],
                'ip': 'Hidden',
                'reason': ban['reason'],
                'admin_name': ban['admin_name'],
                'duration': ban['duration'],
                'ban_date': datetime.now(timezone.utc).isoformat()
            }
            db.bans.insert_one(ban_data)
            synced += 1
        except:
            pass
    
    return synced


# ============================================================
# MAIN REAL-TIME SYNC
# ============================================================

def run_realtime():
    """Run real-time sync with file watching"""
    print("\n" + "="*60)
    print("  ShadowZM REAL-TIME Data Sync")
    print("="*60)
    print(f"\n[CONFIG]")
    print(f"  MongoDB:     {MONGO_URL}")
    print(f"  Database:    {DB_NAME}")
    print(f"  Stats File:  {CSSTATS_FILE}")
    print(f"  Ban Logs:    {BAN_LOGS_DIR}")
    print(f"\n  Player sync: Every {PLAYER_SYNC_INTERVAL} seconds")
    print(f"  Ban check:   Every {BAN_CHECK_INTERVAL} seconds (instant sync on change)")
    print("="*60)
    print("\nPress Ctrl+C to stop\n")
    
    # Test connection
    client, db = get_db()
    if db is None:
        print("[FAILED] Cannot connect to MongoDB")
        return
    client.close()
    
    last_ban_hash = ""
    last_player_sync = 0
    
    while True:
        try:
            now = time.time()
            
            # Check for ban changes (every 5 seconds)
            current_ban_hash = get_ban_files_hash()
            
            if current_ban_hash != last_ban_hash:
                # Ban files changed - sync immediately!
                client, db = get_db()
                if db is not None:
                    bans = parse_ban_logs(BAN_LOGS_DIR)
                    count = sync_bans(db, bans)
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 BAN CHANGE DETECTED - Synced {count} bans instantly!")
                    client.close()
                last_ban_hash = current_ban_hash
            
            # Sync players (every 60 seconds)
            if now - last_player_sync >= PLAYER_SYNC_INTERVAL:
                client, db = get_db()
                if db is not None:
                    players = parse_csstats(CSSTATS_FILE)
                    count = sync_players(db, players)
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] 👥 Synced {count} players")
                    client.close()
                last_player_sync = now
            
            time.sleep(BAN_CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\nStopping...")
            break
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(BAN_CHECK_INTERVAL)


def clear_all_data():
    """Clear all data from database"""
    print("\nClearing all data from database...")
    client, db = get_db()
    if db is None:
        print("[FAILED] Cannot connect to MongoDB")
        return
    
    db.players.delete_many({})
    db.bans.delete_many({})
    print("✓ All players and bans cleared!")
    client.close()


def sync_once():
    """Run sync once"""
    print("\n" + "="*60)
    print("  ShadowZM - One-Time Sync")
    print("="*60)
    
    client, db = get_db()
    if db is None:
        print("[FAILED] Cannot connect to MongoDB")
        return
    
    print("\n[1] Syncing players...")
    players = parse_csstats(CSSTATS_FILE)
    p_count = sync_players(db, players)
    print(f"    ✓ Synced {p_count} players")
    
    print("\n[2] Syncing bans...")
    bans = parse_ban_logs(BAN_LOGS_DIR)
    b_count = sync_bans(db, bans)
    print(f"    ✓ Synced {b_count} bans")
    
    print("\n" + "="*60)
    print("  SYNC COMPLETE!")
    print("="*60 + "\n")
    
    client.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['--clear', '-c', 'clear']:
            clear_all_data()
        elif arg in ['--once', '-o', 'once']:
            sync_once()
        else:
            print("Usage:")
            print("  python3 realtime_sync.py           # Run real-time sync")
            print("  python3 realtime_sync.py --once    # Sync once")
            print("  python3 realtime_sync.py --clear   # Clear all data")
    else:
        run_realtime()
