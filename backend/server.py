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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
ACCESS_TOKEN_MINUTES = int(os.environ['ACCESS_TOKEN_MINUTES'])
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

app = FastAPI(title="Big S Media Production API")
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class QuoteCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    service_type: str  # "production" | "numerisation" | "autre"
    budget: Optional[str] = ""
    message: str


class Quote(QuoteCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "nouveau"  # nouveau | en_cours | traite
    created_at: str = Field(default_factory=now_iso)


class AppointmentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    service_type: str
    date: str
    time: str
    notes: Optional[str] = ""


class Appointment(AppointmentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "en_attente"  # en_attente | confirme | annule
    created_at: str = Field(default_factory=now_iso)


class ProjectCreate(BaseModel):
    title: str
    category: str
    description: str
    image_url: str
    year: Optional[str] = ""
    published: bool = True


class Project(ProjectCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    year: Optional[str] = None
    published: Optional[bool] = None


class StatusUpdate(BaseModel):
    status: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def create_token(email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": f"admin:{email}",
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou expirés",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub", "")
        if not sub.startswith("admin:") or payload.get("role") != "admin":
            raise unauthorized
        email = sub.removeprefix("admin:")
    except jwt.PyJWTError:
        raise unauthorized
    admin = await db.admins.find_one({"email": email, "disabled": {"$ne": True}})
    if not admin:
        raise unauthorized
    return {"email": email}


# ---------------------------------------------------------------------------
# Public data
# ---------------------------------------------------------------------------
SERVICES = [
    {
        "id": "production",
        "title": "Production Audiovisuelle",
        "tagline": "Films, publicités, clips & événements",
        "description": "De la conception à la post-production, nous réalisons des œuvres cinématographiques sur mesure : films institutionnels, publicités, clips musicaux, captation d'événements et reportages. Une équipe créative équipée de matériel professionnel.",
        "image_url": "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMHNldCUyMGRpcmVjdG9yfGVufDB8fHx8MTc4OTE3ODc4Mnww&ixlib=rb-4.1.0&q=85",
        "features": [
            "Réalisation & mise en scène",
            "Captation multi-caméras 4K",
            "Montage & étalonnage",
            "Habillage sonore & musique",
        ],
    },
    {
        "id": "numerisation",
        "title": "Numérisation de Cassettes",
        "tagline": "Préservez vos souvenirs pour toujours",
        "description": "Transférez vos cassettes VHS, Hi8, MiniDV, audio et vieux formats vers un support numérique haute qualité. Nous nettoyons, restaurons et archivons vos souvenirs pour qu'ils traversent le temps.",
        "image_url": "https://images.unsplash.com/photo-1705951427178-4ae10a3d576e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxODh8MHwxfHNlYXJjaHwxfHxWSFMlMjBjYXNzZXR0ZSUyMHRhcGVzJTIwcmV0cm8lMjBzdGFja3xlbnwwfHx8fDE3ODkxNzg3ODJ8MA&ixlib=rb-4.1.0&q=85",
        "features": [
            "VHS, Hi8, MiniDV, audio",
            "Restauration & nettoyage",
            "Export USB / cloud",
            "Archivage sécurisé",
        ],
    },
]

SEED_PROJECTS = [
    {
        "title": "Lumière Rouge",
        "category": "Clip Musical",
        "description": "Un clip musical à l'esthétique néo-noir tourné entièrement en studio avec un éclairage rouge dramatique.",
        "image_url": "https://images.unsplash.com/photo-1761701390408-f05014b3741a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzOTB8MHwxfHNlYXJjaHw0fHxjaW5lbWF0aWMlMjBjYW1lcmElMjBkYXJrJTIwc3R1ZGlvJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg5MTc4NzgyfDA&ixlib=rb-4.1.0&q=85",
        "year": "2025",
    },
    {
        "title": "Sur le Plateau",
        "category": "Film Institutionnel",
        "description": "Captation d'un tournage cinématographique mettant en valeur le savoir-faire de notre équipe technique.",
        "image_url": "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMHNldCUyMGRpcmVjdG9yfGVufDB8fHx8MTc4OTE3ODc4Mnww&ixlib=rb-4.1.0&q=85",
        "year": "2024",
    },
    {
        "title": "Équipe en Action",
        "category": "Publicité",
        "description": "Spot publicitaire dynamique réalisé avec une équipe complète et un dispositif multi-caméras.",
        "image_url": "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBmaWxtJTIwcHJvZHVjdGlvbiUyMHNldCUyMGRpcmVjdG9yfGVufDB8fHx8MTc4OTE3ODc4Mnww&ixlib=rb-4.1.0&q=85",
        "year": "2024",
    },
    {
        "title": "Mémoires Analogiques",
        "category": "Numérisation",
        "description": "Projet de préservation d'archives familiales : plus de 200 cassettes VHS restaurées et numérisées.",
        "image_url": "https://images.unsplash.com/photo-1705951427178-4ae10a3d576e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxODh8MHwxfHNlYXJjaHwxfHxWSFMlMjBjYXNzZXR0ZSUyMHRhcGVzJTIwcmV0cm8lMjBzdGFja3xlbnwwfHx8fDE3ODkxNzg3ODJ8MA&ixlib=rb-4.1.0&q=85",
        "year": "2023",
    },
]


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Big S Media Production API"}


@api_router.get("/services")
async def get_services():
    return SERVICES


@api_router.get("/portfolio", response_model=List[Project])
async def get_portfolio():
    docs = await db.projects.find(
        {"published": True, "deleted_at": {"$exists": False}}
    ).sort("created_at", -1).to_list(200)
    return [Project(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]


@api_router.get("/portfolio/{project_id}", response_model=Project)
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id, "deleted_at": {"$exists": False}})
    if not doc:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return Project(**{k: v for k, v in doc.items() if k != "_id"})


@api_router.post("/quotes", response_model=Quote)
async def create_quote(payload: QuoteCreate):
    quote = Quote(**payload.dict())
    await db.quotes.insert_one(quote.dict())
    return quote


@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(payload: AppointmentCreate):
    appt = Appointment(**payload.dict())
    await db.appointments.insert_one(appt.dict())
    return appt


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    admin = await db.admins.find_one({"email": payload.email.lower()})
    if not admin or not pwd_context.verify(payload.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="E-mail ou mot de passe incorrect")
    token = create_token(payload.email.lower())
    return {"access_token": token, "token_type": "bearer", "email": payload.email.lower()}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return {"email": admin["email"], "role": "admin"}


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    quotes = await db.quotes.count_documents({})
    new_quotes = await db.quotes.count_documents({"status": "nouveau"})
    appts = await db.appointments.count_documents({})
    pending_appts = await db.appointments.count_documents({"status": "en_attente"})
    projects = await db.projects.count_documents({"deleted_at": {"$exists": False}})
    return {
        "quotes": quotes,
        "new_quotes": new_quotes,
        "appointments": appts,
        "pending_appointments": pending_appts,
        "projects": projects,
    }


@api_router.get("/admin/quotes", response_model=List[Quote])
async def admin_quotes(admin: dict = Depends(get_current_admin)):
    docs = await db.quotes.find().sort("created_at", -1).to_list(500)
    return [Quote(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]


@api_router.patch("/admin/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    res = await db.quotes.find_one_and_update(
        {"id": quote_id}, {"$set": {"status": payload.status}}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return Quote(**{k: v for k, v in res.items() if k != "_id"})


@api_router.get("/admin/appointments", response_model=List[Appointment])
async def admin_appointments(admin: dict = Depends(get_current_admin)):
    docs = await db.appointments.find().sort("created_at", -1).to_list(500)
    return [Appointment(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]


@api_router.patch("/admin/appointments/{appt_id}", response_model=Appointment)
async def update_appointment(appt_id: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    res = await db.appointments.find_one_and_update(
        {"id": appt_id}, {"$set": {"status": payload.status}}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    return Appointment(**{k: v for k, v in res.items() if k != "_id"})


@api_router.get("/admin/portfolio", response_model=List[Project])
async def admin_portfolio(admin: dict = Depends(get_current_admin)):
    docs = await db.projects.find({"deleted_at": {"$exists": False}}).sort("created_at", -1).to_list(500)
    return [Project(**{k: v for k, v in d.items() if k != "_id"}) for d in docs]


@api_router.post("/admin/portfolio", response_model=Project)
async def create_project(payload: ProjectCreate, admin: dict = Depends(get_current_admin)):
    project = Project(**payload.dict())
    await db.projects.insert_one(project.dict())
    return project


@api_router.patch("/admin/portfolio/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, admin: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    res = await db.projects.find_one_and_update(
        {"id": project_id, "deleted_at": {"$exists": False}}, {"$set": updates}, return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return Project(**{k: v for k, v in res.items() if k != "_id"})


@api_router.delete("/admin/portfolio/{project_id}")
async def delete_project(project_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.projects.update_one(
        {"id": project_id}, {"$set": {"deleted_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return {"success": True}


# ---------------------------------------------------------------------------
# Startup: seed admin + portfolio
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def seed():
    existing = await db.admins.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing:
        await db.admins.insert_one({
            "email": ADMIN_EMAIL.lower(),
            "hashed_password": pwd_context.hash(ADMIN_PASSWORD),
            "role": "admin",
            "disabled": False,
            "created_at": now_iso(),
        })
        logger.info("Seeded admin account")
    count = await db.projects.count_documents({})
    if count == 0:
        for p in SEED_PROJECTS:
            await db.projects.insert_one(Project(published=True, **p).dict())
        logger.info("Seeded portfolio projects")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
