"""
StudyBuddy Learning Platform - Backend API
FastAPI application for managing learning resources, courses, and user interactions.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="StudyBuddy API",
    description="Backend API for StudyBuddy Learning Platform",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint - API health check."""
    return {
        "message": "Welcome to StudyBuddy API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/v1/courses")
def get_courses():
    """Get all available courses."""
    return {
        "courses": [
            {
                "id": 1,
                "name": "Python Basics",
                "description": "Learn Python fundamentals",
                "level": "Beginner"
            },
            {
                "id": 2,
                "name": "Web Development",
                "description": "Build modern web applications",
                "level": "Intermediate"
            }
        ]
    }


@app.post("/api/v1/courses")
def create_course(course: dict):
    """Create a new course."""
    return {
        "id": 3,
        "message": "Course created successfully",
        "course": course
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
