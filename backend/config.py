"""
Configuration settings for StudyBuddy API.
"""

import os
from typing import Optional

# API Settings
API_TITLE = "StudyBuddy API"
API_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Database Settings (placeholder)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./studybuddy.db")

# CORS Settings - restrict origins in production
DEV_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"]
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", ",".join(DEV_ALLOWED_ORIGINS)).split(",")

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# JWT Settings (optional, for future auth)
# WARNING: Change SECRET_KEY in production via environment variable
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    import warnings
    warnings.warn(
        "SECRET_KEY not set in environment. Using a weak placeholder. "
        "Set SECRET_KEY environment variable for production.",
        RuntimeWarning,
        stacklevel=1,
    )
    SECRET_KEY = "dev-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
