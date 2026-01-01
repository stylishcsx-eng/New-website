#!/usr/bin/env python3
"""
ShadowZM Complete Data Sync Script
Syncs player stats from csstats.dat and bans from BAN_HISTORY logs to MongoDB
KEEPS expired bans (marks them as expired instead of deleting)
"""

import struct
import glob
import re
import os
import sys
import time
from datetime import datetime, timezone, timedelta
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


def parse_duration_to_minutes(duration_str):
    """Convert duration string to minutes"""
    if not duration_str:
        return None
    
    duration_lower = duration_str.lower()
    
    if 'permanent' in duration_lower:
        return None  # Permanent = no expiry
    
    # Parse "X minutes", "X hours", "X days", etc.
    match = re.search(r'(\d+)\s*(minute|hour|day|week|month|year)', duration_lower)
    if match:
        value = int(match.group(1))
        unit = match.group(2)
        
        if 'minute' in unit:
            return value
        elif 'hour' in unit:
            return value * 60
        elif 'day' in unit:
            return value * 60 * 24
        elif 'week' in unit:
            return value * 60 * 24 * 7
        elif 'month' in unit:
            return value * 60 * 24 * 30
        elif 'year' in unit:
            return value * 60 * 24 * 365
    
    # Try just number (assume minutes)
    try:
        return int(duration_str)
    except:
        return None


def calculate_expiry(ban_date_str, duration_str):
    """Calculate expiry datetime from ban date and duration"""
    minutes = parse_duration_to_minutes(duration_str)
    if minutes is None:
        return None  # Permanent
    
    try:
        # Parse the ban date
        ban_date = datetime.fromisoformat(ban_date_str.replace('Z', '+00:00'))
        expiry = ban_date + timedelta(minutes=minutes)
        return expiry.isoformat()
    except:
        return None


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
    """Parse BAN_HISTORY log files - keeps ALL bans including expired ones"""
    if not os.path.exists(log_dir):
        print(f"[WARN] Ban logs dir not found: {log_dir}")
        return []
    
    log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
    if not log_files:
        return []
    
    # Track all ban events
    all_bans = {}  # steamid -> list of ban events
    unban_events = {}  # steamid -> list of unban timestamps
    
    for log_file in sorted(log_files):
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban (ban expired)
                    if 'unbanned' in line or 'Ban time is up' in line:
                        # Extract timestamp
                        time_match = re.search(r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2})', line)
                        timestamp = time_match.group(1) if time_match else None
                        
                        unban_match = re.search(r'unbanned .+? <([^>]+)>', line)
                        if unban_match:
                            steamid = unban_match.group(1)
                            if steamid not in unban_events:
                                unban_events[steamid] = []
                            unban_events[steamid].append(timestamp)
                        
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            steamid = expire_match.group(1)
                            if steamid not in unban_events:
                                unban_events[steamid] = []
                            unban_events[steamid].append(timestamp)
                    
                    # Check for ban
                    elif 'banned' in line and '||' in line:
                        pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
                        match = re.match(pattern, line)
                        if match:
                            timestamp, admin, _, player, steamid, reason, duration = match.groups()
                            
                            # Parse timestamp to ISO format
                            try:
                                dt = datetime.strptime(timestamp, '%m/%d/%Y - %H:%M:%S')
                                dt = dt.replace(tzinfo=timezone.utc)
                                ban_date_iso = dt.isoformat()
                            except:
                                ban_date_iso = datetime.now(timezone.utc).isoformat()
                            
                            ban_data = {
                                'id': f"{steamid.strip()}_{hash(timestamp)}",
                                'player_nickname': player.strip(),
                                'steamid': steamid.strip(),
                                'ip': 'hidden',
                                'reason': reason.strip() or 'No reason provided',
                                'admin_name': admin.strip(),
                                'duration': duration.strip(),
                                'ban_date': ban_date_iso,
                                'source': 'server',
                                'is_expired': False,
                                'expires_at': None
                            }
                            
                            # Calculate expiry
                            expires_at = calculate_expiry(ban_date_iso, duration.strip())
                            ban_data['expires_at'] = expires_at
                            
                            # Check if already expired
                            if expires_at:
                                try:
                                    expiry_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                                    if expiry_dt < datetime.now(timezone.utc):
                                        ban_data['is_expired'] = True
                                except:
                                    pass
                            
                            if steamid.strip() not in all_bans:
                                all_bans[steamid.strip()] = []
                            all_bans[steamid.strip()].append(ban_data)
        except Exception as e:
            print(f"[ERROR] Failed to read {log_file}: {e}")
    
    # Process bans - mark expired ones based on unban events
    final_bans = []
    for steamid, bans in all_bans.items():
        for ban in bans:
            # Check if this ban was unbanned
            if steamid in unban_events:
                # If there's an unban after this ban, mark as expired
                for unban_time in unban_events[steamid]:
                    if unban_time and ban.get('ban_date'):
                        try:
                            unban_dt = datetime.strptime(unban_time, '%m/%d/%Y - %H:%M:%S')
                            ban_dt = datetime.fromisoformat(ban['ban_date'].replace('Z', '+00:00')).replace(tzinfo=None)
                            if unban_dt > ban_dt:
                                ban['is_expired'] = True
                                break
                        except:
                            pass
            
            final_bans.append(ban)
    
    return final_bans


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
    """Sync bans to MongoDB - UPSERT to keep existing bans"""
    if not bans:
        return 0
    
    synced = 0
    for ban in bans:
        try:
            # Upsert - update if exists, insert if not
            db.bans.update_one(
                {'id': ban['id']},
                {'$set': ban},
                upsert=True
            )
            synced += 1
        except Exception as e:
            print(f"[ERROR] Failed to sync ban: {e}")
    
    return synced


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
    active_bans = len([b for b in bans if not b.get('is_expired')])
    expired_bans = len([b for b in bans if b.get('is_expired')])
    print(f"  ✓ Synced {b_count} bans ({active_bans} active, {expired_bans} expired)")
    
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
