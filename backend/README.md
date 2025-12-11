# StudyBuddy Backend

FastAPI-based backend for the StudyBuddy Learning Platform.

## Setup

1. **Create virtual environment** (if not already created):
```bash
python -m venv venv
```

2. **Activate virtual environment**:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Run the development server**:
```bash
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py           # FastAPI application entry point
├── config.py         # Configuration settings
├── requirements.txt  # Python dependencies
├── venv/             # Virtual environment
└── app/              # (Future) Application modules
    ├── api/          # API routes
    ├── models/       # Database models
    ├── schemas/      # Pydantic schemas
    └── services/     # Business logic
```

## Development

Run tests:
```bash
pytest
```

Format code:
```bash
black .
isort .
```

## Environment Variables

Create a `.env` file in the backend directory:
```
DEBUG=False
DATABASE_URL=sqlite:///./studybuddy.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
SECRET_KEY=your-secret-key-here
```
