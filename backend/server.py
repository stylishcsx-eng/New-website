from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
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

class BanUpdate(BaseModel):
    player_nickname: Optional[str] = None
    steamid: Optional[str] = None
    reason: Optional[str] = None
    duration: Optional[str] = None

class AdminApplicationCreate(BaseModel):
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str

class AdminApplicationResponse(BaseModel):
    id: str
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str
    status: str
    submitted_at: str

class AdminApplicationUpdate(BaseModel):
    status: str

class NotificationResponse(BaseModel):
    id: str
    steamid: Optional[str] = None
    nickname: Optional[str] = None
    message: str
    type: str
    read: bool
    created_at: str

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
class ForumCategoryCreate(BaseModel):
    name: str
    description: str
    icon: Optional[str] = "MessageSquare"

class ForumCategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    topic_count: int
    created_at: str

class ForumTopicCreate(BaseModel):
    category_id: str
    title: str
    content: str

class ForumTopicResponse(BaseModel):
    id: str
    category_id: str
    title: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    reply_count: int
    is_pinned: bool
    is_locked: bool
    created_at: str
    last_reply_at: Optional[str] = None

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
    created_at: str

# Team Models
class TeamMemberCreate(BaseModel):
    name: str
    role: str
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: int = 0

class TeamMemberResponse(BaseModel):
    id: str
    name: str
    role: str
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: int

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    discord_id: Optional[str] = None
    steamid: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

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
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(owner_user)
        logging.info("Default owner created: Stylish")

async def init_default_forum_categories():
    count = await db.forum_categories.count_documents({})
    if count == 0:
        categories = [
            {"id": str(uuid.uuid4()), "name": "General", "description": "General discussion about the server", "icon": "MessageSquare", "topic_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Support", "description": "Need help? Ask here!", "icon": "HelpCircle", "topic_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Off-Topic", "description": "Talk about anything!", "icon": "Coffee", "topic_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.forum_categories.insert_many(categories)
        logging.info("Default forum categories created")

async def init_default_team():
    count = await db.team_members.count_documents({})
    if count == 0:
        members = [
            {"id": str(uuid.uuid4()), "name": "Stylish", "role": "Owner", "discord_id": None, "steamid": "STEAM_0:0:171538078", "avatar": "https://customer-assets.emergentagent.com/job_cs-server-sync/artifacts/dy6oo11y_ChatGPT%20Image%20Dec%2020%2C%202025%2C%2006_47_46%20PM.png", "description": "Server Founder & Developer", "order": 1},
            {"id": str(uuid.uuid4()), "name": "Nico", "role": "Owner", "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 2},
            {"id": str(uuid.uuid4()), "name": "Angry.exe", "role": "Owner", "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 3},
            {"id": str(uuid.uuid4()), "name": "Pak", "role": "Owner", "discord_id": None, "steamid": None, "avatar": None, "description": "Server Owner", "order": 4},
        ]
        await db.team_members.insert_many(members)
        logging.info("Default team members created")

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
        # Exchange code for token
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
            
            # Get user info from Discord
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
            
            # Check if user exists
            existing_user = await db.users.find_one({"discord_id": discord_id})
            
            if existing_user:
                # Update user info
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
                # Create new user
                user = {
                    "id": str(uuid.uuid4()),
                    "nickname": discord_username,
                    "email": discord_email,
                    "password": None,
                    "steamid": None,
                    "role": "player",
                    "discord_id": discord_id,
                    "discord_avatar": discord_avatar,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(user)
            
            # Create JWT token
            jwt_token = create_token({"sub": user["id"], "role": user.get("role", "player")})
            
            # Redirect to frontend with token
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
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if nickname already exists
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

# Keep admin login for backend access
@api_router.post("/auth/admin-login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    user = await db.users.find_one({"nickname": data.username, "role": {"$in": ["admin", "owner"]}}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

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
async def get_bans(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"player_nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]
    bans = await db.bans.find(query, {"_id": 0}).to_list(1000)
    return bans

@api_router.post("/bans", response_model=BanResponse)
async def create_ban(data: BanCreate, user = Depends(require_admin)):
    ban = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "ban_date": datetime.now(timezone.utc).isoformat()
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

# ==================== BAN WEBHOOK ====================

class BanWebhookData(BaseModel):
    secret: str
    player_nickname: str
    steamid: str
    reason: str
    admin_name: str
    duration: str

@api_router.post("/bans/webhook")
async def receive_ban_webhook(data: BanWebhookData):
    if data.secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    existing = await db.bans.find_one({"steamid": data.steamid, "reason": data.reason})
    if existing:
        return {"message": "Ban already exists", "id": existing["id"]}
    
    ban = {
        "id": str(uuid.uuid4()),
        "player_nickname": data.player_nickname,
        "steamid": data.steamid,
        "ip": "Hidden",
        "reason": data.reason,
        "admin_name": data.admin_name,
        "duration": data.duration,
        "ban_date": datetime.now(timezone.utc).isoformat(),
        "source": "server"
    }
    await db.bans.insert_one(ban)
    return {"message": "Ban added", "id": ban["id"]}

@api_router.delete("/bans/webhook/{steamid}")
async def remove_ban_webhook(steamid: str, secret: str):
    if secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    result = await db.bans.delete_many({"steamid": steamid})
    return {"message": f"Removed {result.deleted_count} ban(s)"}

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

# ==================== PLAYER STATS WEBHOOK ====================

class PlayerStatsWebhookData(BaseModel):
    secret: str
    nickname: str
    steamid: str
    kills: int
    deaths: int
    headshots: int = 0

@api_router.post("/players/webhook")
async def receive_player_stats_webhook(data: PlayerStatsWebhookData):
    if data.secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    kd_ratio = round(data.kills / max(data.deaths, 1), 2)
    level = min(50, data.kills // 500)
    
    existing = await db.players.find_one({"steamid": data.steamid})
    
    player_data = {
        "nickname": data.nickname,
        "steamid": data.steamid,
        "kills": data.kills,
        "deaths": data.deaths,
        "headshots": data.headshots,
        "kd_ratio": kd_ratio,
        "level": level,
        "last_seen": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.players.update_one({"steamid": data.steamid}, {"$set": player_data})
        return {"message": "Player updated", "steamid": data.steamid}
    else:
        player_data["id"] = str(uuid.uuid4())
        player_data["rank"] = 0
        await db.players.insert_one(player_data)
        return {"message": "Player added", "steamid": data.steamid}

# ==================== ADMIN APPLICATIONS ROUTES ====================

@api_router.get("/admin-applications", response_model=List[AdminApplicationResponse])
async def get_admin_applications(user = Depends(require_admin)):
    apps = await db.admin_applications.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(100)
    return apps

@api_router.post("/admin-applications", response_model=AdminApplicationResponse)
async def create_admin_application(data: AdminApplicationCreate):
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_app = await db.admin_applications.find_one({
        "steamid": data.steamid,
        "submitted_at": {"$gte": thirty_days_ago}
    })
    if recent_app:
        raise HTTPException(status_code=400, detail="You can only apply once per month.")
    
    app = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_applications.insert_one(app)
    return app

@api_router.patch("/admin-applications/{app_id}", response_model=AdminApplicationResponse)
async def update_admin_application(app_id: str, data: AdminApplicationUpdate, user = Depends(require_admin)):
    application = await db.admin_applications.find_one({"id": app_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    result = await db.admin_applications.find_one_and_update(
        {"id": app_id},
        {"$set": {"status": data.status}},
        return_document=True
    )
    result.pop("_id", None)
    
    notification = {
        "id": str(uuid.uuid4()),
        "steamid": application["steamid"],
        "nickname": application["nickname"],
        "message": f"Your admin application has been {data.status}!",
        "type": "application_" + data.status,
        "read": False,
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

@api_router.delete("/admin-applications/bulk/old")
async def delete_old_applications(user = Depends(require_admin)):
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    result = await db.admin_applications.delete_many({"submitted_at": {"$lt": thirty_days_ago}})
    return {"message": f"Deleted {result.deleted_count} old applications"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(steamid: Optional[str] = None, nickname: Optional[str] = None):
    query = {}
    if steamid:
        query["steamid"] = steamid
    if nickname:
        query["nickname"] = nickname
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str):
    await db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str):
    await db.notifications.delete_one({"id": notif_id})
    return {"message": "Notification deleted"}

# ==================== FORUM ROUTES ====================

@api_router.get("/forum/categories", response_model=List[ForumCategoryResponse])
async def get_forum_categories():
    categories = await db.forum_categories.find({}, {"_id": 0}).to_list(100)
    # Update topic counts
    for cat in categories:
        cat["topic_count"] = await db.forum_topics.count_documents({"category_id": cat["id"]})
    return categories

@api_router.post("/forum/categories", response_model=ForumCategoryResponse)
async def create_forum_category(data: ForumCategoryCreate, user = Depends(require_admin)):
    category = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "topic_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forum_categories.insert_one(category)
    return category

@api_router.delete("/forum/categories/{category_id}")
async def delete_forum_category(category_id: str, user = Depends(require_admin)):
    await db.forum_topics.delete_many({"category_id": category_id})
    await db.forum_categories.delete_one({"id": category_id})
    return {"message": "Category and all topics deleted"}

@api_router.get("/forum/topics")
async def get_forum_topics(category_id: Optional[str] = None, limit: int = 50):
    query = {}
    if category_id:
        query["category_id"] = category_id
    topics = await db.forum_topics.find(query, {"_id": 0}).sort([("is_pinned", -1), ("last_reply_at", -1), ("created_at", -1)]).to_list(limit)
    return topics

@api_router.get("/forum/topics/{topic_id}")
async def get_forum_topic(topic_id: str):
    topic = await db.forum_topics.find_one({"id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
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
        "reply_count": 0,
        "is_pinned": False,
        "is_locked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_reply_at": None
    }
    await db.forum_topics.insert_one(topic)
    await db.forum_categories.update_one({"id": data.category_id}, {"$inc": {"topic_count": 1}})
    return topic

@api_router.delete("/forum/topics/{topic_id}")
async def delete_forum_topic(topic_id: str, user = Depends(require_auth)):
    topic = await db.forum_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Only author or admin can delete
    if topic["author_id"] != user["id"] and user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.forum_replies.delete_many({"topic_id": topic_id})
    await db.forum_topics.delete_one({"id": topic_id})
    await db.forum_categories.update_one({"id": topic["category_id"]}, {"$inc": {"topic_count": -1}})
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

@api_router.get("/forum/replies/{topic_id}", response_model=List[ForumReplyResponse])
async def get_forum_replies(topic_id: str):
    replies = await db.forum_replies.find({"topic_id": topic_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
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
        "content": data.content,
        "author_id": user["id"],
        "author_name": user["nickname"],
        "author_avatar": user.get("discord_avatar"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.forum_replies.insert_one(reply)
    await db.forum_topics.update_one(
        {"id": data.topic_id},
        {"$inc": {"reply_count": 1}, "$set": {"last_reply_at": reply["created_at"]}}
    )
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
    return members

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
async def update_user_role(user_id: str, role: str, user = Depends(require_owner)):
    if role not in ["player", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": f"User role updated to {role}"}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "shadowzm: Zombie reverse API", "version": "2.0.0"}

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
