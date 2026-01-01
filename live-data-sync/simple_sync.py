#!/usr/bin/env python3
"""
SIMPLE CS 1.6 Data Sync Script for ShadowZM Website
===================================================
This script syncs player stats and ban data from your game server to MongoDB.

Run manually to test:
    python3 simple_sync.py

Run continuously:
    python3 simple_sync.py --continuous
"""

import struct
import glob
import re
import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient

# ============================================================
# CONFIGURATION - YOUR SPECIFIC PATHS (ALREADY SET)
# ============================================================

# MongoDB Connection - Change this to match your VPS setup
# Common options:
#   mongodb://localhost:27017          (if MongoDB is on same server)
#   mongodb://127.0.0.1:27017          (same as above)
#   mongodb://your-ip:27017            (if MongoDB is on different server)
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "shadowzm_database"

# Your CS 1.6 Server Files (Pterodactyl paths - already configured)
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/logs"

# How often to sync (in seconds) when running continuously
SYNC_INTERVAL = 60

# ============================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================

def print_header():
    print("\n" + "="*60)
    print("  ShadowZM - CS 1.6 Data Sync Script")
    print("="*60)
    print(f"\n[CONFIG]")
    print(f"  MongoDB:     {MONGO_URL}")
    print(f"  Database:    {DB_NAME}")
    print(f"  Stats File:  {CSSTATS_FILE}")
    print(f"  Ban Logs:    {BAN_LOGS_DIR}")
    print("="*60 + "\n")


def test_mongodb_connection():
    """Test MongoDB connection and return database object"""
    print("[STEP 1] Connecting to MongoDB...")
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        print("  ✓ MongoDB connection successful!")
        db = client[DB_NAME]
        print(f"  ✓ Using database: {DB_NAME}")
        return client, db
    except Exception as e:
        print(f"  ✗ MongoDB connection FAILED!")
        print(f"  Error: {e}")
        print("\n  TROUBLESHOOTING:")
        print("  1. Is MongoDB running? Try: sudo systemctl status mongod")
        print("  2. Check if MongoDB is listening: sudo netstat -tlnp | grep 27017")
        print("  3. Try connecting manually: mongosh")
        return None, None


def check_files_exist():
    """Check if the required files and directories exist"""
    print("\n[STEP 2] Checking game files...")
    
    files_ok = True
    
    # Check stats file
    if os.path.exists(CSSTATS_FILE):
        size = os.path.getsize(CSSTATS_FILE)
        print(f"  ✓ Stats file found: {CSSTATS_FILE}")
        print(f"    Size: {size} bytes")
    else:
        print(f"  ✗ Stats file NOT FOUND: {CSSTATS_FILE}")
        files_ok = False
    
    # Check ban logs directory
    if os.path.exists(BAN_LOGS_DIR):
        print(f"  ✓ Ban logs directory found: {BAN_LOGS_DIR}")
        log_files = glob.glob(f"{BAN_LOGS_DIR}/BAN_HISTORY_*.log")
        print(f"    Found {len(log_files)} BAN_HISTORY log files")
    else:
        print(f"  ✗ Ban logs directory NOT FOUND: {BAN_LOGS_DIR}")
        files_ok = False
    
    return files_ok


def parse_csstats(filepath):
    """Parse csstats.dat file and return player data"""
    print("\n[STEP 3] Parsing player stats...")
    
    if not os.path.exists(filepath):
        print(f"  ✗ File not found: {filepath}")
        return []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
        print(f"  ✓ Read {len(data)} bytes from stats file")
    except PermissionError:
        print(f"  ✗ Permission denied reading: {filepath}")
        print("  Try: sudo chmod 644 {filepath}")
        return []
    except Exception as e:
        print(f"  ✗ Error reading file: {e}")
        return []
    
    if len(data) < 10:
        print("  ✗ Stats file is too small or empty")
        return []
    
    players = []
    offset = 2  # Skip header
    
    while offset < len(data) - 10:
        try:
            # Read name length
            if offset + 2 > len(data):
                break
            name_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            
            if name_len == 0 or name_len > 64:
                break
            
            # Read name
            if offset + name_len > len(data):
                break
            name = data[offset:offset+name_len].rstrip(b'\x00').decode('utf-8', errors='ignore')
            offset += name_len
            
            # Read steamid length
            if offset + 2 > len(data):
                break
            steamid_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            
            if steamid_len == 0 or steamid_len > 64:
                break
            
            # Read steamid
            if offset + steamid_len > len(data):
                break
            steamid = data[offset:offset+steamid_len].rstrip(b'\x00').decode('utf-8', errors='ignore')
            offset += steamid_len
            
            # Read stats (7 integers = 28 bytes)
            if offset + 28 > len(data):
                break
            
            stats = list(struct.unpack('<7i', data[offset:offset+28]))
            offset += 28
            
            tks, damage, deaths, kills, shots, hits, headshots = stats
            
            # Skip invalid entries
            if kills < 0 or deaths < 0 or not steamid:
                continue
            
            # Calculate KD ratio
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
            
        except Exception as e:
            break
    
    # Sort by kills (highest first)
    players.sort(key=lambda x: x['kills'], reverse=True)
    
    # Assign ranks
    for i, p in enumerate(players):
        p['rank'] = i + 1
    
    print(f"  ✓ Parsed {len(players)} players from stats file")
    return players


def parse_ban_logs(log_dir):
    """Parse ban history logs and return active bans"""
    print("\n[STEP 4] Parsing ban logs...")
    
    if not os.path.exists(log_dir):
        print(f"  ✗ Directory not found: {log_dir}")
        return []
    
    log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
    
    if not log_files:
        print(f"  ! No BAN_HISTORY_*.log files found")
        print(f"    This is okay if no players have been banned yet")
        return []
    
    print(f"  ✓ Found {len(log_files)} log files to process")
    
    all_bans = []
    unbanned_steamids = set()
    
    for log_file in sorted(log_files):
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban entries
                    if 'unbanned' in line or 'Ban time is up' in line:
                        unban_match = re.search(r'unbanned .+? <([^>]+)>', line)
                        if unban_match:
                            unbanned_steamids.add(unban_match.group(1))
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            unbanned_steamids.add(expire_match.group(1))
                    
                    # Check for ban entries
                    elif 'banned' in line and '||' in line:
                        pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
                        match = re.match(pattern, line)
                        if match:
                            timestamp_str, admin_name, admin_steam, player_name, player_steam, reason, duration = match.groups()
                            all_bans.append({
                                'timestamp': timestamp_str,
                                'admin_name': admin_name.strip(),
                                'player_nickname': player_name.strip(),
                                'steamid': player_steam.strip(),
                                'reason': reason.strip() if reason.strip() else "Banned",
                                'duration': duration.strip()
                            })
        except Exception as e:
            print(f"  ! Error reading {log_file}: {e}")
            continue
    
    # Keep only latest ban per player, exclude unbanned
    latest_bans = {}
    for ban in all_bans:
        steamid = ban['steamid']
        latest_bans[steamid] = ban
    
    active_bans = [v for k, v in latest_bans.items() if k not in unbanned_steamids]
    
    print(f"  ✓ Found {len(active_bans)} active bans")
    return active_bans


def sync_players_to_db(db, players):
    """Sync player data to MongoDB"""
    print("\n[STEP 5] Syncing players to database...")
    
    if not players:
        print("  ! No players to sync")
        return 0
    
    synced = 0
    errors = 0
    
    for player in players:
        try:
            # Add timestamp and ID for new records
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
            
            # Update existing or insert new
            result = db.players.update_one(
                {'steamid': player['steamid']},
                {'$set': player_data, '$setOnInsert': {'id': player['steamid']}},
                upsert=True
            )
            synced += 1
            
        except Exception as e:
            errors += 1
            if errors <= 3:  # Only show first 3 errors
                print(f"  ! Error syncing {player['nickname']}: {e}")
    
    print(f"  ✓ Synced {synced} players ({errors} errors)")
    return synced


def sync_bans_to_db(db, bans):
    """Sync ban data to MongoDB"""
    print("\n[STEP 6] Syncing bans to database...")
    
    # Clear old bans and insert fresh data
    try:
        db.bans.delete_many({})
        print("  ✓ Cleared old ban data")
    except Exception as e:
        print(f"  ! Error clearing bans: {e}")
        return 0
    
    if not bans:
        print("  ! No active bans to sync (this is okay)")
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
        except Exception as e:
            print(f"  ! Error syncing ban for {ban['player_nickname']}: {e}")
    
    print(f"  ✓ Synced {synced} bans")
    return synced


def run_sync_once():
    """Run a single sync operation"""
    print_header()
    
    # Step 1: Connect to MongoDB
    client, db = test_mongodb_connection()
    if db is None:
        print("\n[FAILED] Cannot proceed without MongoDB connection")
        return False
    
    # Step 2: Check files exist
    if not check_files_exist():
        print("\n[WARNING] Some files are missing, but will continue...")
    
    # Step 3: Parse player stats
    players = parse_csstats(CSSTATS_FILE)
    
    # Step 4: Parse ban logs
    bans = parse_ban_logs(BAN_LOGS_DIR)
    
    # Step 5: Sync players
    sync_players_to_db(db, players)
    
    # Step 6: Sync bans
    sync_bans_to_db(db, bans)
    
    # Done
    print("\n" + "="*60)
    print("  SYNC COMPLETE!")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Players synced: {len(players)}")
    print(f"  Bans synced: {len(bans)}")
    print("="*60 + "\n")
    
    client.close()
    return True


def run_continuous():
    """Run sync continuously"""
    import time
    
    print_header()
    print(f"Running in CONTINUOUS mode (every {SYNC_INTERVAL} seconds)")
    print("Press Ctrl+C to stop\n")
    
    # Initial connection test
    client, db = test_mongodb_connection()
    if db is None:
        print("\n[FAILED] Cannot proceed without MongoDB connection")
        return
    client.close()
    
    while True:
        try:
            # Reconnect each time (more reliable)
            client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
            db = client[DB_NAME]
            
            print(f"\n--- Sync at {datetime.now().strftime('%H:%M:%S')} ---")
            
            # Parse and sync
            players = parse_csstats(CSSTATS_FILE)
            bans = parse_ban_logs(BAN_LOGS_DIR)
            
            if players:
                sync_players_to_db(db, players)
            if bans:
                sync_bans_to_db(db, bans)
            
            print(f"Done. Next sync in {SYNC_INTERVAL} seconds...")
            
            client.close()
            time.sleep(SYNC_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\nStopping...")
            break
        except Exception as e:
            print(f"\nError during sync: {e}")
            print(f"Will retry in {SYNC_INTERVAL} seconds...")
            time.sleep(SYNC_INTERVAL)


def show_help():
    """Show help message"""
    print("""
ShadowZM CS 1.6 Data Sync Script
================================

Usage:
    python3 simple_sync.py              # Run once (for testing)
    python3 simple_sync.py --continuous # Run continuously
    python3 simple_sync.py --help       # Show this help

Before running:
    1. Make sure MongoDB is installed and running
    2. Check that the file paths at the top of this script are correct
    3. Test with a single run first, then use --continuous

To check if MongoDB is running:
    sudo systemctl status mongod

To find your MongoDB connection:
    mongosh --eval "db.version()"
""")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ['--continuous', '-c', 'continuous']:
            run_continuous()
        elif arg in ['--help', '-h', 'help']:
            show_help()
        else:
            print(f"Unknown argument: {arg}")
            show_help()
    else:
        # Default: run once
        run_sync_once()
