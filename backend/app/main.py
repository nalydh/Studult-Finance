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
    
    from app.scheduler import start_scheduler, stop_scheduler
    start_scheduler()
    
    yield
    print("Shutdown: Cleaning up...")
    stop_scheduler()

app = FastAPI(lifespan=lifespan)

# ── CORS origins ──────────────────────────────────────────────────────────────
# Set APP_URLS in the DigitalOcean App Platform env as a comma-separated list:
#   https://stufin.starkandco.site,https://preview.stufin.starkandco.site
# Also supports the legacy single-value APP_URL variable.
_allowed_origins = ["http://localhost:3000", "http://localhost:3001", "https://stufin.starkandco.site"]
for _url in os.getenv("APP_URLS", os.getenv("APP_URL", "")).split(","):
    _url = _url.strip().rstrip("/")
    if _url and _url not in _allowed_origins:
        _allowed_origins.append(_url)

# This prints to the DigitalOcean runtime logs — confirms exactly what origins
# the running instance sees. Check the app's Runtime Logs after your next deploy.
print(f"[CORS] Allowed origins: {_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Rate limiter ──────────────────────────────────────────────────────────────
# Patched handler so that a rate-limited preflight OPTIONS request still gets
# the Access-Control-Allow-Origin header back. Without this, slowapi's default
# JSONResponse bypasses CORSMiddleware and the browser sees a CORS failure
# instead of a 429.
app.state.limiter = limiter


def _cors_aware_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    origin = request.headers.get("origin", "")
    headers: dict[str, str] = {}
    if hasattr(exc, "retry_after"):
        headers["Retry-After"] = str(exc.retry_after)
    if origin in _allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
        headers=headers,
    )


app.add_exception_handler(RateLimitExceeded, _cors_aware_rate_limit_handler)

# Include routers
app.include_router(budget.router)
app.include_router(asset.router)
app.include_router(category.router)
app.include_router(snapshots.router)
app.include_router(accounts.router)
app.include_router(analytics.router)
app.include_router(investmentcontributions.router)
app.include_router(auth.router)