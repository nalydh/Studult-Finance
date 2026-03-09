from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from app.database import engine
from app.routers import budget
from app.routers import asset
from app.routers import category
from app.routers import snapshots
from app.routers import accounts
from app.models.account import Account 

def create_db_and_tables():
  SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
  print("Startup: Creating database tables...")
  create_db_and_tables()
  yield
  print("Shutdown: Cleaning up...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000", "http://localhost:3001"],
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