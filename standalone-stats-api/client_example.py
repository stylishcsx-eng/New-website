#!/usr/bin/env python3
"""
Simple Client Example - How to use the Stats API
"""
import requests
import json
from typing import Optional

class CS16StatsClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
    
    def get_server_status(self):
        """Get live server status"""
        response = requests.get(f"{self.base_url}/server-status")
        return response.json()
    
    def get_rankings(self, limit: int = 15):
        """Get top players"""
        response = requests.get(f"{self.base_url}/rankings/top?limit={limit}")
        return response.json()
    
    def get_player(self, steamid: str):
        """Get specific player stats"""
        response = requests.get(f"{self.base_url}/rankings/player/{steamid}")
        return response.json()
    
    def get_bans(self):
        """Get all active bans"""
        response = requests.get(f"{self.base_url}/bans")
        return response.json()
    
    def check_ban(self, steamid: str):
        """Check if player is banned"""
        response = requests.get(f"{self.base_url}/bans/{steamid}")
        return response.json()
    
    def get_stats(self):
        """Get overall server statistics"""
        response = requests.get(f"{self.base_url}/stats")
        return response.json()

# Example usage
if __name__ == "__main__":
    # Initialize client
    client = CS16StatsClient("http://YOUR_PTERODACTYL_IP:8002")
    
    print("=" * 60)
    print("CS 1.6 Stats API Client Example")
    print("=" * 60)
    
    # Get server status
    print("\n1. Server Status:")
    server = client.get_server_status()
    if server.get('online'):
        print(f"   ✅ Server ONLINE")
        print(f"   Map: {server['map']}")
        print(f"   Players: {server['players']}/{server['max_players']}")
    else:
        print(f"   ❌ Server OFFLINE")
    
    # Get top 5 players
    print("\n2. Top 5 Players:")
    rankings = client.get_rankings(limit=5)
    for player in rankings['players']:
        print(f"   #{player['rank']} {player['nickname']}")
        print(f"      Kills: {player['kills']} | Deaths: {player['deaths']} | K/D: {player['kd_ratio']}")
    
    # Get bans
    print("\n3. Active Bans:")
    bans = client.get_bans()
    print(f"   Total bans: {bans['total']}")
    if bans['bans']:
        for ban in bans['bans'][:3]:  # Show first 3
            print(f"   - {ban['player_nickname']} ({ban['steamid']})")
            print(f"     Reason: {ban['reason']}")
    
    # Get overall stats
    print("\n4. Overall Statistics:")
    stats = client.get_stats()
    print(f"   Total Players: {stats['statistics']['total_players']}")
    print(f"   Total Kills: {stats['statistics']['total_kills']}")
    print(f"   Total Bans: {stats['statistics']['total_bans']}")
    
    if stats['top_player']:
        top = stats['top_player']
        print(f"\n   Top Player: {top['nickname']}")
        print(f"   Kills: {top['kills']} | K/D: {top['kd_ratio']}")
    
    print("\n" + "=" * 60)
