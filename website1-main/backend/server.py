from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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

# ==================== INIT DEFAULT OWNER ====================

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
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(owner_user)
        logging.info("Default owner created: Stylish")

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

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "nickname": data.nickname,
        "email": data.email,
        "password": hash_password(data.password),
        "steamid": data.steamid,
        "role": "player",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.post("/auth/admin-login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    user = await db.users.find_one({"nickname": data.username, "role": {"$in": ["admin", "owner"]}}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(require_auth)):
    return {k: v for k, v in user.items() if k != "password"}

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

# Clear routes MUST be before parameterized routes
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

# Clear route MUST be before parameterized routes
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
    return {"message": "shadowzm: Zombie reverse API", "version": "1.0.0"}

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
