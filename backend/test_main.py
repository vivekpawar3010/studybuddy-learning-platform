"""
Example test for the API root endpoint.
Run with: pytest
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_courses():
    """Test get courses endpoint."""
    response = client.get("/api/v1/courses")
    assert response.status_code == 200
    assert "courses" in response.json()
    assert len(response.json()["courses"]) > 0
