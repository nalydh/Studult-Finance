from sqlmodel import create_engine, Session
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "For local dev, create backend/.env (e.g. DATABASE_URL=sqlite:///./local.db)."
    )

# SQLite connections are thread-bound by default, but FastAPI serves sync
# endpoints from a threadpool — this flag is required for local SQLite dev.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=_connect_args)

def get_session():
    with Session(engine) as session:
        yield session