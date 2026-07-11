from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, groups, proposals, evaluations, admin
from routers import ai_routes, documents, supervisor_requests, users
from services.scheduler import create_scheduler
from contextlib import asynccontextmanager
import models

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler on app startup
    scheduler = create_scheduler()
    scheduler.start()
    print("✓ Scheduler started — deadline reminders will run daily at 8:00 AM")
    yield
    # Stop scheduler on shutdown
    scheduler.shutdown()
    print("Scheduler stopped")

app = FastAPI(
    title="FYPMS API",
    description="Final Year Project Management System — IoBM",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(proposals.router)
app.include_router(evaluations.router)
app.include_router(admin.router)
app.include_router(ai_routes.router)
app.include_router(documents.router)
app.include_router(supervisor_requests.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "FYPMS API is running", "docs": "/docs"}