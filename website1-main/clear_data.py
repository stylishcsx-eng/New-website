#!/usr/bin/env python3
"""
Clear dummy data from MongoDB
Run: python3 /home/clear_data.py
"""
from pymongo import MongoClient

# Connect to MongoDB (default local connection)
client = MongoClient('mongodb://localhost:27017/')
db = client['shadowzm']

print("=== Clearing dummy data ===")

# Clear bans
result = db.bans.delete_many({})
print(f"Cleared {result.deleted_count} bans")

# Clear players
result = db.players.delete_many({})
print(f"Cleared {result.deleted_count} players")

print("\n=== Done! ===")
print("Refresh your website to see empty banlist and rankings.")
print("Then run the sync scripts to populate with real data.")
