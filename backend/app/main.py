import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlmodel import SQLModel
from app.database import engine
from app.routers import budget
from app.routers import asset
from app.routers import category
from app.routers import snapshots
from app.routers import accounts
from app.routers import analytics
from app.routers import investmentcontributions
from app.routers import auth
from app.models import investmentcontribution 
from app.models import user  
from app.models import emailtoken  


limiter = Limiter(key_func=get_remote_address)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: Creating database tables...")
    create_db_and_tables()
    yield
    print("Shutdown: Cleaning up...")


app = FastAPI(lifespan=lifespan)

# Attach slowapi limiter + 429 handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow localhost for dev + production frontend from APP_URL env var
_app_url = os.getenv("APP_URL", "").rstrip("/")
_allowed_origins = ["http://localhost:3000", "http://localhost:3001"]
if _app_url and _app_url not in _allowed_origins:
    _allowed_origins.append(_app_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(budget.router)
app.include_router(asset.router)
app.include_router(category.router)
app.include_router(snapshots.router)
app.include_router(accounts.router)
app.include_router(analytics.router)
app.include_router(investmentcontributions.router)
app.include_router(auth.router)