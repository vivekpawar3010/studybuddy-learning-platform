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

# CORS Settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# JWT Settings (optional, for future auth)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
