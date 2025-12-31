#!/usr/bin/env python3
"""
Import existing bans from Advanced Bans log to website
Run: python3 /home/import_bans.py
"""
import re
import requests
import glob
from datetime import datetime

# Configuration
WEBSITE_URL = "http://82.22.174.126:8085"
SECRET = "shadowzm-ban-secret-2024"
LOG_DIR = "/var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/logs"

def parse_ban_line(line):
    """Parse a ban line from Advanced Bans log"""
    # Pattern: L MM/DD/YYYY - HH:MM:SS: AdminName <ADMIN_STEAM> banned PlayerName <PLAYER_STEAM> || Reason: "reason" || Ban Length: duration
    pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
    
    match = re.match(pattern, line)
    if match:
        timestamp_str, admin_name, admin_steam, player_name, player_steam, reason, duration = match.groups()
        return {
            'timestamp': timestamp_str,
            'admin_name': admin_name.strip(),
            'player_nickname': player_name.strip(),
            'steamid': player_steam.strip(),
            'reason': reason.strip() if reason.strip() else "Banned",
            'duration': duration.strip()
        }
    return None

def parse_unban_line(line):
    """Parse an unban line to track unbanned players"""
    # Pattern for unban
    pattern = r'unbanned (.+?) <([^>]+)>'
    match = re.search(pattern, line)
    if match:
        return match.group(2).strip()  # Return steamid
    return None

def sync_ban(ban):
    """Send ban to website"""
    try:
        response = requests.post(
            f"{WEBSITE_URL}/api/bans/webhook",
            json={
                "secret": SECRET,
                "player_nickname": ban['player_nickname'],
                "steamid": ban['steamid'],
                "reason": ban['reason'],
                "admin_name": ban['admin_name'],
                "duration": ban['duration']
            },
            timeout=10
        )
        if response.status_code == 200:
            return True, response.json().get('message', 'Success')
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    print("=== Advanced Bans Import Tool ===")
    print(f"Looking for logs in: {LOG_DIR}")
    
    # Find all ban history logs
    log_files = glob.glob(f"{LOG_DIR}/BAN_HISTORY_*.log")
    
    if not log_files:
        print("No BAN_HISTORY log files found!")
        return
    
    print(f"Found {len(log_files)} log file(s)")
    
    all_bans = []
    unbanned_steamids = set()
    
    # Parse all log files
    for log_file in sorted(log_files):
        print(f"\nParsing: {log_file}")
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban first
                    if 'unbanned' in line or 'Ban time is up' in line:
                        steamid = parse_unban_line(line)
                        if steamid:
                            unbanned_steamids.add(steamid)
                        # Also check for "Ban time is up"
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            unbanned_steamids.add(expire_match.group(1))
                    
                    # Check for ban
                    elif 'banned' in line and '||' in line:
                        ban = parse_ban_line(line)
                        if ban:
                            all_bans.append(ban)
        except Exception as e:
            print(f"Error reading {log_file}: {e}")
    
    print(f"\nFound {len(all_bans)} ban entries")
    print(f"Found {len(unbanned_steamids)} unban entries")
    
    # Filter out unbanned players (only keep active bans)
    # Get the latest ban for each steamid
    latest_bans = {}
    for ban in all_bans:
        steamid = ban['steamid']
        latest_bans[steamid] = ban  # Keep overwriting with latest
    
    # Remove unbanned players
    active_bans = {k: v for k, v in latest_bans.items() if k not in unbanned_steamids}
    
    print(f"Active bans to sync: {len(active_bans)}")
    
    if not active_bans:
        print("\nNo active bans to import.")
        print("All bans have been unbanned or expired.")
        return
    
    # Sync active bans
    print("\n=== Syncing to website ===")
    synced = 0
    failed = 0
    
    for steamid, ban in active_bans.items():
        success, msg = sync_ban(ban)
        if success:
            print(f"✓ {ban['player_nickname']} ({steamid}): {msg}")
            synced += 1
        else:
            print(f"✗ {ban['player_nickname']} ({steamid}): {msg}")
            failed += 1
    
    print(f"\n=== Complete ===")
    print(f"Synced: {synced}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    main()
