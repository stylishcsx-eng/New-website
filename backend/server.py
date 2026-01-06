from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import a2s
import asyncio
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET', 'shadowzm-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# CS 1.6 Server Config
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016
CS_SERVER_NAME = "ShadowZM : Zombie Reverse"

# Webhook secret for ban sync
BAN_WEBHOOK_SECRET = os.environ.get('BAN_WEBHOOK_SECRET', 'shadowzm-ban-secret-2024')

# Discord OAuth Config
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '1453754197760675933')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', '5eiS6-KAQODqhAWiLliO3oha-PnBidbK')
DISCORD_REDIRECT_URI = os.environ.get('DISCORD_REDIRECT_URI', 'https://shadowzm.xyz/api/auth/discord/callback')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://shadowzm.xyz')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    nickname: str
    email: EmailStr
    password: str
    steamid: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    nickname: str
    email: str
    steamid: Optional[str] = None
    role: str
    created_at: str
    discord_id: Optional[str] = None
    discord_avatar: Optional[str] = None
    bio: Optional[str] = None
    post_count: Optional[int] = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BanCreate(BaseModel):
    player_nickname: str
    steamid: str
    ip: str
    reason: str
    admin_name: str
    duration: str

class BanResponse(BaseModel):
    id: str
    player_nickname: str
    steamid: str
    ip: str
    reason: str
    admin_name: str
    duration: str
    ban_date: str
    is_expired: Optional[bool] = False
    expires_at: Optional[str] = None

class BanUpdate(BaseModel):
    player_nickname: Optional[str] = None
    steamid: Optional[str] = None
    reason: Optional[str] = None
    duration: Optional[str] = None
    is_expired: Optional[bool] = None

class AdminApplicationCreate(BaseModel):
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str
    admin_commands_knowledge: str  # "bad", "good", "excellent"

class AdminApplicationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str
    admin_commands_knowledge: Optional[str] = "good"
    status: str
    admin_reason: Optional[str] = None
    submitted_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None

class AdminApplicationUpdate(BaseModel):
    status: str
    admin_reason: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    steamid: Optional[str] = None
    nickname: Optional[str] = None
    title: Optional[str] = None
    message: str
    type: str
    read: bool
    created_at: str
    link: Optional[str] = None

class PlayerResponse(BaseModel):
    id: str
    nickname: str
    steamid: str
    kills: int
    deaths: int
    headshots: int
    level: int
    rank: int
    kd_ratio: float
    last_seen: str

class ServerStatusResponse(BaseModel):
    online: bool
    server_name: str
    server_ip: str
    current_map: str
    players_online: int
    max_players: int
    ping: int
    players: List[dict]

class DashboardStats(BaseModel):
    total_users: int
    total_players: int
    total_bans: int
    online_players: int
    pending_applications: int

class CreateAdminUser(BaseModel):
    nickname: str
    email: EmailStr
    password: str
    steamid: Optional[str] = None

# Forum Models
class ForumSectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "MessageSquare"
    order: Optional[int] = 0

class ForumSectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    icon: str
    order: int
    categories: Optional[List[dict]] = []

class ForumCategoryCreate(BaseModel):
    name: str
    description: str
    icon: Optional[str] = "MessageSquare"
    order: Optional[int] = 0
    section_id: Optional[str] = None
    tags: Optional[List[str]] = []

class ForumCategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    order: int
    section_id: Optional[str] = None
    tags: Optional[List[str]] = []
    topic_count: int
    post_count: int
    last_post: Optional[dict] = None
    created_at: str

class ForumTopicCreate(BaseModel):
    category_id: str
    title: str
    content: str
    tag: Optional[str] = None

class ForumTopicResponse(BaseModel):
    id: str
    category_id: str
    title: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    reply_count: int
    view_count: int
    is_pinned: bool
    is_locked: bool
    tag: Optional[str] = None
    created_at: str
    last_reply_at: Optional[str] = None
    last_reply_by: Optional[str] = None

class ForumReplyCreate(BaseModel):
    topic_id: str
    content: str

class ForumReplyResponse(BaseModel):
    id: str
    topic_id: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    author_post_count: Optional[int] = 0
    created_at: str

# Team Models
class TeamMemberCreate(BaseModel):
    name: str
    role: str
    role_type: str = "member"  # "owner", "admin", "moderator", "member"
    user_id: Optional[str] = None  # Link to user profile if exists
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: int = 0

class TeamMemberResponse(BaseModel):
    id: str
    name: str
    role: str
    role_type: str
    user_id: Optional[str] = None
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: int

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    role_type: Optional[str] = None
    user_id: Optional[str] = None
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

# Team Role Configuration
class TeamRoleConfig(BaseModel):
    name: str
    color: str
    order: int

class TeamRoleConfigCreate(BaseModel):
    name: str
    color: str
    order: int = 0

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    steamid: Optional[str] = None
    birthday: Optional[str] = None
    location: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    nickname: str
    role: Optional[str] = "player"
    discord_avatar: Optional[str] = None
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    bio: Optional[str] = None
    birthday: Optional[str] = None
    location: Optional[str] = None
    post_count: int = 0
    reputation: int = 0
    followers_count: int = 0
    warning_points: int = 0
    is_following: bool = False
    is_online: bool = False
    last_seen: Optional[str] = None
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

async def require_auth(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(user = Depends(require_auth)):
    if user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_owner(user = Depends(require_auth)):
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user

# ==================== INIT DEFAULT DATA ====================

async def init_default_admin():
    owner = await db.users.find_one({"role": "owner"})
    if not owner:
        owner_user = {
            "id": str(uuid.uuid4()),
            "nickname": "Stylish",
            "email": "owner@shadowzm.com",
            "password": hash_password("Itachi1849"),
            "steamid": "STEAM_0:0:000000",
            "role": "owner",
            "discord_id": None,
            "discord_avatar": None,
            "bio": "Server Owner & Developer",
            "post_count": 0,
            "reputation": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(owner_user)
        logging.info("Default owner created: Stylish")

async def init_default_forum_categories():
    count = await db.forum_categories.count_documents({})
    if count == 0:
        categories = [
            {"id": str(uuid.uuid4()), "name": "Announcements", "description": "Server news and announcements", "icon": "Megaphone", "order": 1, "topic_count": 0, "post_count": 0, "last_post": None, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "General Discussion", "description": "Talk about anything related to the server", "icon": "MessageSquare", "order": 2, "topic_count": 0, "post_count": 0, "last_post": None, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Support", "description": "Need help? Ask here!", "icon": "HelpCircle", "order": 3, "topic_count": 0, "post_count": 0, "last_post": None, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Ban Appeals", "description": "Appeal your ban here", "icon": "Scale", "order": 4, "topic_count": 0, "post_count": 0, "last_post": None, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Off-Topic", "description": "Talk about anything!", "icon": "Coffee", "order": 5, "topic_count": 0, "post_count": 0, "last_post": None, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.forum_categories.insert_many(categories)
        logging.info("Default forum categories created")

async def init_default_team():
    count = await db.team_members.count_documents({})
    if count == 0:
        members = [
            {"id": str(uuid.uuid4()), "name": "Stylish", "role": "Owner", "role_type": "owner", "user_id": None, "discord_id": None, "steamid": "STEAM_0:0:171538078", "avatar": "https://customer-assets.emergentagent.com/job_cs-server-sync/artifacts/dy6oo11y_ChatGPT%20Image%20Dec%2020%2C%202025%2C%2006_47_46%20PM.png", "description": "Server Founder & Developer", "order": 1},
            {"id": str(uuid.uuid4()), "name": "Nico", "role": "Owner", "role_type": "owner", "user_id": None, "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 2},
            {"id": str(uuid.uuid4()), "name": "Angry.exe", "role": "Owner", "role_type": "owner", "user_id": None, "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 3},
            {"id": str(uuid.uuid4()), "name": "Pak", "role": "Owner", "role_type": "owner", "user_id": None, "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 4},
        ]
        await db.team_members.insert_many(members)
        logging.info("Default team members created")
    
    # Initialize default team roles
    role_count = await db.team_roles.count_documents({})
    if role_count == 0:
        default_roles = [
            {"id": str(uuid.uuid4()), "name": "Owner", "color": "#ef4444", "order": 1},  # Red
            {"id": str(uuid.uuid4()), "name": "Admin", "color": "#22c55e", "order": 2},  # Green
            {"id": str(uuid.uuid4()), "name": "Moderator", "color": "#3b82f6", "order": 3},  # Blue
            {"id": str(uuid.uuid4()), "name": "Member", "color": "#a855f7", "order": 4},  # Purple
        ]
        await db.team_roles.insert_many(default_roles)
        logging.info("Default team roles created")

# ==================== SERVER STATUS ====================

async def query_cs_server():
    try:
        loop = asyncio.get_event_loop()
        address = (CS_SERVER_IP, CS_SERVER_PORT)
        
        info = await loop.run_in_executor(None, lambda: a2s.info(address, timeout=5))
        players = await loop.run_in_executor(None, lambda: a2s.players(address, timeout=5))
        
        player_list = [{"name": p.name, "score": p.score, "duration": int(p.duration)} for p in players if p.name]
        
        return {
            "online": True,
            "server_name": info.server_name or CS_SERVER_NAME,
            "server_ip": f"{CS_SERVER_IP}:{CS_SERVER_PORT}",
            "current_map": info.map_name or "de_dust2",
            "players_online": info.player_count,
            "max_players": info.max_players,
            "ping": int(info.ping * 1000) if hasattr(info, 'ping') else 0,
            "players": player_list
        }
    except Exception as e:
        logging.warning(f"Failed to query CS server: {e}")
        return {
            "online": False,
            "server_name": CS_SERVER_NAME,
            "server_ip": f"{CS_SERVER_IP}:{CS_SERVER_PORT}",
            "current_map": "N/A",
            "players_online": 0,
            "max_players": 32,
            "ping": 0,
            "players": []
        }

# ==================== DISCORD OAUTH ROUTES ====================

@api_router.get("/auth/discord")
async def discord_login():
    """Redirect to Discord OAuth"""
    discord_auth_url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify%20email"
    )
    return RedirectResponse(url=discord_auth_url)

@api_router.get("/auth/discord/callback")
async def discord_callback(code: str = Query(...)):
    """Handle Discord OAuth callback"""
    try:
        async with httpx.AsyncClient() as client_http:
            token_response = await client_http.post(
                "https://discord.com/api/oauth2/token",
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                logging.error(f"Discord token error: {token_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_auth_failed")
            
            token_data = token_response.json()
            access_token = token_data["access_token"]
            
            user_response = await client_http.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                logging.error(f"Discord user error: {user_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_user_failed")
            
            discord_user = user_response.json()
            discord_id = discord_user["id"]
            discord_username = discord_user["username"]
            discord_email = discord_user.get("email", f"{discord_id}@discord.user")
            discord_avatar = None
            if discord_user.get("avatar"):
                discord_avatar = f"https://cdn.discordapp.com/avatars/{discord_id}/{discord_user['avatar']}.png"
            
            existing_user = await db.users.find_one({"discord_id": discord_id})
            
            if existing_user:
                await db.users.update_one(
                    {"discord_id": discord_id},
                    {"$set": {
                        "nickname": discord_username,
                        "discord_avatar": discord_avatar,
                        "email": discord_email
                    }}
                )
                user = existing_user
            else:
                user = {
                    "id": str(uuid.uuid4()),
                    "nickname": discord_username,
                    "email": discord_email,
                    "password": None,
                    "steamid": None,
                    "role": "player",
                    "discord_id": discord_id,
                    "discord_avatar": discord_avatar,
                    "bio": None,
                    "post_count": 0,
                    "reputation": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(user)
            
            jwt_token = create_token({"sub": user["id"], "role": user.get("role", "player")})
            return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}")
            
    except Exception as e:
        logging.error(f"Discord OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=server_error")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(require_auth)):
    return {k: v for k, v in user.items() if k != "password"}

# Email/Password Login
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not user.get("password") or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user["id"], "role": user.get("role", "player")})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

# Email/Password Register
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_nick = await db.users.find_one({"nickname": data.nickname})
    if existing_nick:
        raise HTTPException(status_code=400, detail="Nickname already taken")
    
    user = {
        "id": str(uuid.uuid4()),
        "nickname": data.nickname,
        "email": data.email,
        "password": hash_password(data.password),
        "steamid": data.steamid,
        "role": "player",
        "discord_id": None,
        "discord_avatar": None,
        "bio": None,
        "post_count": 0,
        "reputation": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

# Admin login
@api_router.post("/auth/admin-login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    user = await db.users.find_one({"nickname": data.username, "role": {"$in": ["admin", "owner"]}}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

# ==================== USER PROFILE ROUTES ====================

@api_router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, request: Request = None):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get post count
    post_count = await db.forum_replies.count_documents({"author_id": user_id})
    topic_count = await db.forum_topics.count_documents({"author_id": user_id})
    user["post_count"] = post_count + topic_count
    user["reputation"] = user.get("reputation", 0)
    user["followers_count"] = await db.user_follows.count_documents({"following_id": user_id})
    user["warning_points"] = user.get("warning_points", 0)
    
    # Check if request user is following this profile
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            follow = await db.user_follows.find_one({"follower_id": payload["user_id"], "following_id": user_id})
            user["is_following"] = follow is not None
        except:
            user["is_following"] = False
    else:
        user["is_following"] = False
    
    return user

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, limit: int = 20):
    topics = await db.forum_topics.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    replies = await db.forum_replies.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    # For replies, get the topic title
    for r in replies:
        if r.get("topic_id"):
            topic = await db.forum_topics.find_one({"id": r["topic_id"]}, {"title": 1})
            r["topic_title"] = topic["title"] if topic else "Unknown"
    
    # Combine and sort
    all_posts = []
    for t in topics:
        t["type"] = "topic"
        all_posts.append(t)
    for r in replies:
        r["type"] = "reply"
        all_posts.append(r)
    
    all_posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return all_posts[:limit]

@api_router.get("/users/{user_id}/visitors")
async def get_profile_visitors(user_id: str, limit: int = 10):
    visitors = await db.profile_visits.find({"visited_id": user_id}, {"_id": 0}).sort("visited_at", -1).limit(limit).to_list(limit)
    result = []
    for v in visitors:
        visitor = await db.users.find_one({"id": v["visitor_id"]}, {"id": 1, "nickname": 1, "discord_avatar": 1})
        if visitor:
            result.append({
                "id": visitor["id"],
                "nickname": visitor["nickname"],
                "avatar": visitor.get("discord_avatar"),
                "visited_at": v["visited_at"]
            })
    return result

@api_router.post("/users/{user_id}/visit")
async def record_profile_visit(user_id: str, user = Depends(require_auth)):
    if user["id"] == user_id:
        return {"message": "Cannot visit own profile"}
    
    # Update or insert visit record
    await db.profile_visits.update_one(
        {"visitor_id": user["id"], "visited_id": user_id},
        {"$set": {"visited_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Visit recorded"}

@api_router.post("/users/{user_id}/follow")
async def toggle_follow(user_id: str, user = Depends(require_auth)):
    if user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    existing = await db.user_follows.find_one({"follower_id": user["id"], "following_id": user_id})
    if existing:
        await db.user_follows.delete_one({"follower_id": user["id"], "following_id": user_id})
        return {"message": "Unfollowed", "is_following": False}
    else:
        await db.user_follows.insert_one({
            "id": str(uuid.uuid4()),
            "follower_id": user["id"],
            "following_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"message": "Following", "is_following": True}

@api_router.patch("/users/profile")
async def update_profile(data: ProfileUpdate, user = Depends(require_auth)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    return {"message": "Profile updated"}

# ==================== SERVER STATUS ROUTES ====================

@api_router.get("/server-status", response_model=ServerStatusResponse)
async def get_server_status():
    return await query_cs_server()

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    server_status = await query_cs_server()
    total_users = await db.users.count_documents({})
    total_players = await db.players.count_documents({})
    total_bans = await db.bans.count_documents({})
    pending_apps = await db.admin_applications.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "total_players": total_players,
        "total_bans": total_bans,
        "online_players": server_status["players_online"],
        "pending_applications": pending_apps
    }

# ==================== BANS ROUTES ====================

@api_router.get("/bans", response_model=List[BanResponse])
async def get_bans(search: Optional[str] = None, status: Optional[str] = None):
    # First, auto-expire bans that should be expired
    now = datetime.now(timezone.utc).isoformat()
    await db.bans.update_many(
        {"expires_at": {"$lt": now, "$ne": None}, "is_expired": False},
        {"$set": {"is_expired": True}}
    )
    
    query = {}
    if search:
        query["$or"] = [
            {"player_nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]
    
    if status == "active":
        query["is_expired"] = {"$ne": True}
    elif status == "expired":
        query["is_expired"] = True
    
    bans = await db.bans.find(query, {"_id": 0}).sort("ban_date", -1).to_list(1000)
    return bans

@api_router.post("/bans", response_model=BanResponse)
async def create_ban(data: BanCreate, user = Depends(require_admin)):
    # Calculate expiry
    expires_at = None
    is_expired = False
    if data.duration and "permanent" not in data.duration.lower():
        # Parse duration
        import re
        match = re.search(r'(\d+)\s*(minute|hour|day|week|month)', data.duration.lower())
        if match:
            value = int(match.group(1))
            unit = match.group(2)
            delta = timedelta(minutes=value)
            if 'hour' in unit:
                delta = timedelta(hours=value)
            elif 'day' in unit:
                delta = timedelta(days=value)
            elif 'week' in unit:
                delta = timedelta(weeks=value)
            elif 'month' in unit:
                delta = timedelta(days=value*30)
            expires_at = (datetime.now(timezone.utc) + delta).isoformat()
    
    ban = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "ban_date": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
        "is_expired": is_expired,
        "source": "website"
    }
    await db.bans.insert_one(ban)
    return ban

@api_router.delete("/bans/clear/all")
async def clear_all_bans(user = Depends(require_admin)):
    result = await db.bans.delete_many({})
    return {"message": f"Cleared {result.deleted_count} bans"}

@api_router.delete("/bans/{ban_id}")
async def delete_ban(ban_id: str, user = Depends(require_admin)):
    result = await db.bans.delete_one({"id": ban_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ban not found")
    return {"message": "Ban removed"}

@api_router.patch("/bans/{ban_id}")
@api_router.put("/bans/{ban_id}")
async def update_ban(ban_id: str, data: BanUpdate, user = Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.bans.find_one_and_update(
        {"id": ban_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Ban not found")
    result.pop("_id", None)
    return result

@api_router.patch("/bans/{ban_id}/expire")
async def expire_ban(ban_id: str, user = Depends(require_admin)):
    result = await db.bans.find_one_and_update(
        {"id": ban_id},
        {"$set": {"is_expired": True}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Ban not found")
    result.pop("_id", None)
    return result

# ==================== PLAYERS / RANKINGS ROUTES ====================

@api_router.get("/players", response_model=List[PlayerResponse])
async def get_players(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]
    players = await db.players.find(query, {"_id": 0}).sort("kills", -1).to_list(100)
    return players

@api_router.get("/players/{steamid}", response_model=PlayerResponse)
async def get_player(steamid: str):
    player = await db.players.find_one({"steamid": steamid}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.get("/rankings/top", response_model=List[PlayerResponse])
async def get_top_players(limit: int = 15):
    players = await db.players.find({}, {"_id": 0}).sort("kills", -1).to_list(limit)
    for i, p in enumerate(players):
        p["rank"] = i + 1
    return players

@api_router.delete("/players/clear/all")
async def clear_all_players(user = Depends(require_admin)):
    result = await db.players.delete_many({})
    return {"message": f"Cleared {result.deleted_count} players"}

@api_router.get("/players/{steamid}", response_model=PlayerResponse)
async def get_player(steamid: str):
    player = await db.players.find_one({"steamid": steamid}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

# ==================== ADMIN APPLICATIONS ROUTES ====================

@api_router.get("/admin-applications", response_model=List[AdminApplicationResponse])
async def get_admin_applications(user = Depends(require_admin)):
    apps = await db.admin_applications.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(100)
    return apps

@api_router.post("/admin-applications", response_model=AdminApplicationResponse)
async def create_admin_application(data: AdminApplicationCreate, user = Depends(require_auth)):
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_app = await db.admin_applications.find_one({
        "$or": [
            {"steamid": data.steamid},
            {"user_id": user["id"]}
        ],
        "submitted_at": {"$gte": thirty_days_ago}
    })
    if recent_app:
        raise HTTPException(status_code=400, detail="You can only apply once per month.")
    
    app = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **data.model_dump(),
        "status": "pending",
        "admin_reason": None,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
        "reviewed_by": None
    }
    await db.admin_applications.insert_one(app)
    
    # Create notification for the user
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "steamid": data.steamid,
        "nickname": data.nickname,
        "title": "Application Submitted",
        "message": "Your admin application has been submitted and is pending review.",
        "type": "application_submitted",
        "read": False,
        "link": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return app

@api_router.get("/admin-applications/my")
async def get_my_applications(user = Depends(require_auth)):
    apps = await db.admin_applications.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(10)
    return apps

@api_router.patch("/admin-applications/{app_id}", response_model=AdminApplicationResponse)
async def update_admin_application(app_id: str, data: AdminApplicationUpdate, user = Depends(require_admin)):
    application = await db.admin_applications.find_one({"id": app_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {
        "status": data.status,
        "admin_reason": data.admin_reason,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_by": user["nickname"]
    }
    
    result = await db.admin_applications.find_one_and_update(
        {"id": app_id},
        {"$set": update_data},
        return_document=True
    )
    result.pop("_id", None)
    
    # Create notification for the applicant
    status_text = "accepted" if data.status == "accepted" else "rejected"
    message = f"Your admin application has been {status_text}."
    if data.admin_reason:
        message += f" Reason: {data.admin_reason}"
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": application.get("user_id"),
        "steamid": application["steamid"],
        "nickname": application["nickname"],
        "title": f"Application {status_text.capitalize()}",
        "message": message,
        "type": f"application_{data.status}",
        "read": False,
        "link": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return result

@api_router.delete("/admin-applications/{app_id}")
async def delete_admin_application(app_id: str, user = Depends(require_admin)):
    result = await db.admin_applications.delete_one({"id": app_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user = Depends(require_auth)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.get("/notifications/count")
async def get_unread_count(user = Depends(require_auth)):
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"count": count}

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user = Depends(require_auth)):
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]}, 
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.patch("/notifications/read-all")
async def mark_all_read(user = Depends(require_auth)):
    await db.notifications.update_many(
        {"user_id": user["id"]}, 
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, user = Depends(require_auth)):
    await db.notifications.delete_one({"id": notif_id, "user_id": user["id"]})
    return {"message": "Notification deleted"}

# ==================== FORUM ROUTES ====================

# Forum Sections
@api_router.get("/forum/sections", response_model=List[ForumSectionResponse])
async def get_forum_sections():
    sections = await db.forum_sections.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Get categories for each section
    for section in sections:
        categories = await db.forum_categories.find({"section_id": section["id"]}, {"_id": 0}).sort("order", 1).to_list(100)
        for cat in categories:
            if "order" not in cat:
                cat["order"] = 0
            if "tags" not in cat:
                cat["tags"] = []
            cat["topic_count"] = await db.forum_topics.count_documents({"category_id": cat["id"]})
            cat["post_count"] = await db.forum_replies.count_documents({"category_id": cat["id"]})
            
            # Get last post
            last_topic = await db.forum_topics.find({"category_id": cat["id"]}).sort("last_reply_at", -1).limit(1).to_list(1)
            if last_topic:
                cat["last_post"] = {
                    "topic_id": last_topic[0]["id"],
                    "topic_title": last_topic[0]["title"],
                    "author": last_topic[0].get("last_reply_by") or last_topic[0]["author_name"],
                    "date": last_topic[0].get("last_reply_at") or last_topic[0]["created_at"]
                }
        section["categories"] = categories
    
    # Also get categories without section (legacy)
    orphan_categories = await db.forum_categories.find({"section_id": {"$exists": False}}, {"_id": 0}).sort("order", 1).to_list(100)
    if orphan_categories:
        for cat in orphan_categories:
            if "order" not in cat:
                cat["order"] = 0
            if "tags" not in cat:
                cat["tags"] = []
            cat["topic_count"] = await db.forum_topics.count_documents({"category_id": cat["id"]})
            cat["post_count"] = await db.forum_replies.count_documents({"category_id": cat["id"]})
            last_topic = await db.forum_topics.find({"category_id": cat["id"]}).sort("last_reply_at", -1).limit(1).to_list(1)
            if last_topic:
                cat["last_post"] = {
                    "topic_id": last_topic[0]["id"],
                    "topic_title": last_topic[0]["title"],
                    "author": last_topic[0].get("last_reply_by") or last_topic[0]["author_name"],
                    "date": last_topic[0].get("last_reply_at") or last_topic[0]["created_at"]
                }
        sections.append({
            "id": "legacy",
            "name": "Community",
            "description": "",
            "icon": "MessageSquare",
            "order": 999,
            "categories": orphan_categories
        })
    
    return sections

@api_router.post("/forum/sections", response_model=ForumSectionResponse)
async def create_forum_section(data: ForumSectionCreate, user = Depends(require_admin)):
    section = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "categories": []
    }
    await db.forum_sections.insert_one(section)
    return section

@api_router.delete("/forum/sections/{section_id}")
async def delete_forum_section(section_id: str, user = Depends(require_admin)):
    # Delete all categories and their content in this section
    categories = await db.forum_categories.find({"section_id": section_id}).to_list(100)
    for cat in categories:
        await db.forum_topics.delete_many({"category_id": cat["id"]})
        await db.forum_replies.delete_many({"category_id": cat["id"]})
    await db.forum_categories.delete_many({"section_id": section_id})
    await db.forum_sections.delete_one({"id": section_id})
    return {"message": "Section and all content deleted"}

@api_router.get("/forum/categories", response_model=List[ForumCategoryResponse])
async def get_forum_categories():
    categories = await db.forum_categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    for cat in categories:
        # Ensure order exists
        if "order" not in cat:
            cat["order"] = 0
        if "tags" not in cat:
            cat["tags"] = []
        cat["topic_count"] = await db.forum_topics.count_documents({"category_id": cat["id"]})
        cat["post_count"] = await db.forum_replies.count_documents({"category_id": cat["id"]})
        
        # Get last post
        last_topic = await db.forum_topics.find({"category_id": cat["id"]}).sort("last_reply_at", -1).limit(1).to_list(1)
        if last_topic:
            cat["last_post"] = {
                "topic_id": last_topic[0]["id"],
                "topic_title": last_topic[0]["title"],
                "author": last_topic[0].get("last_reply_by") or last_topic[0]["author_name"],
                "date": last_topic[0].get("last_reply_at") or last_topic[0]["created_at"]
            }
    
    return categories

@api_router.post("/forum/categories", response_model=ForumCategoryResponse)
async def create_forum_category(data: ForumCategoryCreate, user = Depends(require_admin)):
    category = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "topic_count": 0,
        "post_count": 0,
        "last_post": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forum_categories.insert_one(category)
    return category

@api_router.delete("/forum/categories/{category_id}")
async def delete_forum_category(category_id: str, user = Depends(require_admin)):
    await db.forum_topics.delete_many({"category_id": category_id})
    await db.forum_replies.delete_many({"category_id": category_id})
    await db.forum_categories.delete_one({"id": category_id})
    return {"message": "Category and all content deleted"}

@api_router.get("/forum/topics")
async def get_forum_topics(category_id: Optional[str] = None, limit: int = 50):
    query = {}
    if category_id:
        query["category_id"] = category_id
    topics = await db.forum_topics.find(query, {"_id": 0}).sort([("is_pinned", -1), ("last_reply_at", -1), ("created_at", -1)]).to_list(limit)
    return topics

@api_router.get("/forum/topics/recent")
async def get_recent_topics(limit: int = 10):
    topics = await db.forum_topics.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return topics

@api_router.get("/forum/topics/{topic_id}")
async def get_forum_topic(topic_id: str):
    topic = await db.forum_topics.find_one({"id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Increment view count
    await db.forum_topics.update_one({"id": topic_id}, {"$inc": {"view_count": 1}})
    topic["view_count"] = topic.get("view_count", 0) + 1
    
    return topic

@api_router.post("/forum/topics", response_model=ForumTopicResponse)
async def create_forum_topic(data: ForumTopicCreate, user = Depends(require_auth)):
    category = await db.forum_categories.find_one({"id": data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    topic = {
        "id": str(uuid.uuid4()),
        "category_id": data.category_id,
        "title": data.title,
        "content": data.content,
        "author_id": user["id"],
        "author_name": user["nickname"],
        "author_avatar": user.get("discord_avatar"),
        "author_role": user.get("role"),
        "reply_count": 0,
        "view_count": 0,
        "is_pinned": False,
        "is_locked": False,
        "tag": data.tag,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_reply_at": datetime.now(timezone.utc).isoformat(),
        "last_reply_by": None
    }
    await db.forum_topics.insert_one(topic)
    
    # Update user post count
    await db.users.update_one({"id": user["id"]}, {"$inc": {"post_count": 1}})
    
    return topic

@api_router.delete("/forum/topics/{topic_id}")
async def delete_forum_topic(topic_id: str, user = Depends(require_auth)):
    topic = await db.forum_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic["author_id"] != user["id"] and user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.forum_replies.delete_many({"topic_id": topic_id})
    await db.forum_topics.delete_one({"id": topic_id})
    return {"message": "Topic deleted"}

@api_router.patch("/forum/topics/{topic_id}/pin")
async def toggle_pin_topic(topic_id: str, user = Depends(require_admin)):
    topic = await db.forum_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    await db.forum_topics.update_one({"id": topic_id}, {"$set": {"is_pinned": not topic.get("is_pinned", False)}})
    return {"message": "Topic pin toggled"}

@api_router.patch("/forum/topics/{topic_id}/lock")
async def toggle_lock_topic(topic_id: str, user = Depends(require_admin)):
    topic = await db.forum_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    await db.forum_topics.update_one({"id": topic_id}, {"$set": {"is_locked": not topic.get("is_locked", False)}})
    return {"message": "Topic lock toggled"}

@api_router.patch("/forum/topics/{topic_id}/tag")
async def update_topic_tag(topic_id: str, data: dict, user = Depends(require_admin)):
    topic = await db.forum_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    await db.forum_topics.update_one({"id": topic_id}, {"$set": {"tag": data.get("tag")}})
    return {"message": "Topic tag updated"}

@api_router.get("/forum/replies/{topic_id}", response_model=List[ForumReplyResponse])
async def get_forum_replies(topic_id: str):
    replies = await db.forum_replies.find({"topic_id": topic_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    # Add author post counts
    for reply in replies:
        user = await db.users.find_one({"id": reply["author_id"]}, {"post_count": 1})
        reply["author_post_count"] = user.get("post_count", 0) if user else 0
    
    return replies

@api_router.post("/forum/replies", response_model=ForumReplyResponse)
async def create_forum_reply(data: ForumReplyCreate, user = Depends(require_auth)):
    topic = await db.forum_topics.find_one({"id": data.topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic.get("is_locked"):
        raise HTTPException(status_code=403, detail="Topic is locked")
    
    reply = {
        "id": str(uuid.uuid4()),
        "topic_id": data.topic_id,
        "category_id": topic.get("category_id"),
        "content": data.content,
        "author_id": user["id"],
        "author_name": user["nickname"],
        "author_avatar": user.get("discord_avatar"),
        "author_role": user.get("role"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forum_replies.insert_one(reply)
    
    await db.forum_topics.update_one(
        {"id": data.topic_id},
        {
            "$inc": {"reply_count": 1}, 
            "$set": {
                "last_reply_at": reply["created_at"],
                "last_reply_by": user["nickname"]
            }
        }
    )
    
    # Update user post count
    await db.users.update_one({"id": user["id"]}, {"$inc": {"post_count": 1}})
    
    return reply

@api_router.delete("/forum/replies/{reply_id}")
async def delete_forum_reply(reply_id: str, user = Depends(require_auth)):
    reply = await db.forum_replies.find_one({"id": reply_id})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if reply["author_id"] != user["id"] and user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.forum_replies.delete_one({"id": reply_id})
    await db.forum_topics.update_one({"id": reply["topic_id"]}, {"$inc": {"reply_count": -1}})
    return {"message": "Reply deleted"}

# ==================== TEAM ROUTES ====================

@api_router.get("/team", response_model=List[TeamMemberResponse])
async def get_team_members():
    members = await db.team_members.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    # Ensure role_type exists for all members
    for m in members:
        if "role_type" not in m:
            m["role_type"] = "owner" if m.get("role", "").lower() == "owner" else "member"
    return members

@api_router.get("/team/roles")
async def get_team_roles():
    roles = await db.team_roles.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return roles

@api_router.post("/team/roles")
async def create_team_role(data: TeamRoleConfigCreate, user = Depends(require_admin)):
    role = {
        "id": str(uuid.uuid4()),
        **data.model_dump()
    }
    await db.team_roles.insert_one(role)
    return role

@api_router.patch("/team/roles/{role_id}")
async def update_team_role(role_id: str, data: dict, user = Depends(require_admin)):
    result = await db.team_roles.find_one_and_update(
        {"id": role_id},
        {"$set": data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Role not found")
    result.pop("_id", None)
    return result

@api_router.delete("/team/roles/{role_id}")
async def delete_team_role(role_id: str, user = Depends(require_admin)):
    await db.team_roles.delete_one({"id": role_id})
    return {"message": "Role deleted"}

@api_router.post("/team", response_model=TeamMemberResponse)
async def create_team_member(data: TeamMemberCreate, user = Depends(require_admin)):
    member = {
        "id": str(uuid.uuid4()),
        **data.model_dump()
    }
    await db.team_members.insert_one(member)
    return member

@api_router.patch("/team/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(member_id: str, data: TeamMemberUpdate, user = Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.team_members.find_one_and_update(
        {"id": member_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Team member not found")
    result.pop("_id", None)
    return result

@api_router.delete("/team/{member_id}")
async def delete_team_member(member_id: str, user = Depends(require_admin)):
    result = await db.team_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted"}

# ==================== OWNER: ADMIN USER MANAGEMENT ====================

@api_router.post("/owner/create-admin")
async def create_admin_user(data: CreateAdminUser, user = Depends(require_owner)):
    existing = await db.users.find_one({"$or": [{"email": data.email}, {"nickname": data.nickname}]})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or nickname already exists")
    
    new_admin = {
        "id": str(uuid.uuid4()),
        "nickname": data.nickname,
        "email": data.email,
        "password": hash_password(data.password),
        "steamid": data.steamid,
        "role": "admin",
        "discord_id": None,
        "discord_avatar": None,
        "bio": None,
        "post_count": 0,
        "reputation": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_admin)
    return {"message": f"Admin user '{data.nickname}' created successfully"}

@api_router.delete("/owner/delete-admin/{user_id}")
async def delete_admin_user(user_id: str, user = Depends(require_owner)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "owner":
        raise HTTPException(status_code=403, detail="Cannot delete owner account")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

@api_router.patch("/owner/update-role/{user_id}")
async def update_user_role(user_id: str, role: str, user = Depends(require_admin)):
    valid_roles = ["player", "moderator", "admin", "owner"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Only owners can promote to owner
    if role == "owner" and user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only owners can promote to owner")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot demote an owner unless you're an owner
    if target_user.get("role") == "owner" and user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": f"User role updated to {role}"}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

# ==================== CHAT ROUTES ====================

class ChatMessageCreate(BaseModel):
    content: str
    image_url: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    created_at: str

@api_router.get("/chat/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(limit: int = 50):
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    # Reverse to show oldest first
    messages.reverse()
    return messages

@api_router.post("/chat/messages", response_model=ChatMessageResponse)
async def create_chat_message(data: ChatMessageCreate, user = Depends(require_auth)):
    message = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["nickname"],
        "user_avatar": user.get("discord_avatar"),
        "user_role": user.get("role"),
        "content": data.content[:500],  # Limit to 500 chars
        "image_url": data.image_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(message)
    return message

@api_router.delete("/chat/messages/{message_id}")
async def delete_chat_message(message_id: str, user = Depends(require_auth)):
    message = await db.chat_messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only allow delete by author or admin/owner
    if message["user_id"] != user["id"] and user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.chat_messages.delete_one({"id": message_id})
    return {"message": "Deleted"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "ShadowZM API", "version": "3.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await init_default_admin()
    await init_default_forum_categories()
    await init_default_team()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
