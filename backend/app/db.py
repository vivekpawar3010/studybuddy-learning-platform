from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
# Prefer a value set in a local .env (if present), otherwise fall back to the process env
from dotenv import load_dotenv, dotenv_values
from pathlib import Path

# Prefer a `.env` located at the backend root (one level above the `app` package).
backend_root_env = Path(__file__).resolve().parents[1] / ".env"
if backend_root_env.exists():
    # load .env into os.environ and override any existing values so local dev overrides system env
    load_dotenv(dotenv_path=str(backend_root_env), override=True)
    _env_vals = dotenv_values(str(backend_root_env))
else:
    _env_vals = {}

# Prefer the explicit .env value when present (now loaded into os.environ), otherwise fall back to process env
DATABASE_URL = _env_vals.get("DATABASE_URL") or os.getenv("DATABASE_URL") or "sqlite:///./studybuddy.db"

# For SQLite, pass check_same_thread; for other DBs this is ignored
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
"""Database configuration for StudyBuddy API.

Uses SQLAlchemy with PostgreSQL (Supabase) or SQLite for development.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./studybuddy.db")

# Create engine with appropriate connection arguments
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
