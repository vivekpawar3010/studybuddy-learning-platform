"""
StudyBuddy API — application entrypoint moved to `app.main`.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS, DEBUG
from app.db import engine
from sqlalchemy import text

app = FastAPI(
    title="StudyBuddy API",
    description="Backend API for StudyBuddy Learning Platform",
    version="1.0.0",
)

# Configure CORS for frontend communication (restricted origins for security)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Restricted to specific origins (see config.py)
    allow_credentials=False,  # Disable credentials with restricted origins for security
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods only
    allow_headers=["Content-Type", "Authorization"],  # Explicit headers only
)


@app.get("/")
def read_root():
    """Root endpoint - API health check."""
    return {
        "message": "Welcome to StudyBuddy API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/db-check")
def db_check():
    """Check database connectivity."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected", "message": "Database connection successful"}
    except Exception as exc:  # noqa: BLE001 broad catch for simple health endpoint
        return {"status": "failed", "message": f"Database connection failed: {exc}"}


@app.get("/api/v1/courses")
def get_courses():
    """Get all available courses (sample)."""
    return {
        "courses": [
            {
                "id": 1,
                "name": "Python Basics",
                "description": "Learn Python fundamentals",
                "level": "Beginner",
            },
            {
                "id": 2,
                "name": "Web Development",
                "description": "Build modern web applications",
                "level": "Intermediate",
            },
        ]
    }


@app.post("/api/v1/courses")
def create_course(course: dict):
    """Create a new course (stub)."""
    return {"id": 3, "message": "Course created successfully", "course": course}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
