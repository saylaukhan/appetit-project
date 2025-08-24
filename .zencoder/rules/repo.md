---
description: Repository Information Overview
alwaysApply: true
---

# APPETIT Food Delivery Platform Information

## Summary
APPETIT is a modern food delivery platform built with React and FastAPI. The system includes a client interface, admin panel, kitchen display system (KDS), and a mobile interface for couriers. It features a multi-role system, responsive design, and comprehensive order management.

## Structure
- **frontend/**: React application with components, pages, and services
- **backend/**: FastAPI application with API routes, database models, and business logic
- **assets/**: Design system and UI mockups
- **.zencoder/**: Configuration files for Zencoder
- **docker-compose.yml**: Docker configuration for the entire application

## Projects

### Frontend (React Application)
**Configuration File**: frontend/package.json

#### Language & Runtime
**Language**: JavaScript/React
**Version**: React 18.2.0
**Build System**: Vite 4.4.5
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react-router-dom 6.14.2 (Routing)
- react-query 3.39.3 (Data fetching)
- axios 1.4.0 (HTTP client)
- react-hot-toast 2.4.1 (Notifications)
- lucide-react 0.263.1 (Icons)
- react-leaflet 4.2.1 (Maps)

**Development Dependencies**:
- @vitejs/plugin-react 4.0.3
- eslint 8.45.0
- Various React type definitions

#### Build & Installation
```bash
cd frontend
npm install
npm run dev
```

#### Docker
**Dockerfile**: frontend/Dockerfile
**Image**: node:18-alpine
**Configuration**: Builds the app and serves it using the 'serve' package on port 3000

### Backend (FastAPI Application)
**Configuration File**: backend/requirements.txt

#### Language & Runtime
**Language**: Python
**Version**: Python 3.11 (based on Dockerfile)
**Framework**: FastAPI 0.115.6
**Database**: SQLAlchemy 2.0.36 with SQLite

#### Dependencies
**Main Dependencies**:
- fastapi 0.115.6 (Web framework)
- uvicorn 0.32.1 (ASGI server)
- sqlalchemy 2.0.36 (ORM)
- alembic 1.14.0 (Database migrations)
- python-jose 3.3.0 (JWT authentication)
- passlib 1.7.4 (Password hashing)
- firebase-admin 6.4.0 (Push notifications)
- pillow 10.4.0 (Image processing)

**Development Dependencies**:
- pytest 7.4.3
- black 23.11.0
- mypy 1.7.1
- isort 5.12.0

#### Build & Installation
```bash
cd backend
pip install -r requirements.txt
python seed_database.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Docker
**Dockerfile**: backend/Dockerfile
**Image**: python:3.11-slim
**Configuration**: Installs dependencies and runs the FastAPI app with uvicorn on port 8000

#### Testing
**Framework**: pytest 7.4.3
**Test Location**: backend/test_*.py files
**Run Command**:
```bash
cd backend
pytest
```

## Deployment

### Docker Compose
**Configuration**: docker-compose.yml
**Services**:
- backend: FastAPI service on port 8000
- frontend: React application on port 3000
**Networks**: appetit-network (bridge)
**Environment Variables**:
- Backend: DATABASE_URL, JWT_SECRET_KEY
- Frontend: VITE_API_URL, VITE_GA_TRACKING_ID