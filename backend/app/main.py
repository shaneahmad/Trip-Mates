from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_indexes
from app.routers import auth, users, trips, posts, matches, chat, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_indexes()
    print("✈️  Trip Mates API is ready!")
    yield
    # Shutdown
    print("👋 Shutting down Trip Mates API")


app = FastAPI(
    title="Trip Mates API",
    description="Find your perfect travel companion — API powering the Trip Mates platform",
    version="1.0.0",
    lifespan=lifespan,
)

import os

# CORS
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://tripmates-ui.vercel.app"
]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    cors_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trips.router)
app.include_router(posts.router)
app.include_router(matches.router)
app.include_router(chat.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    return {
        "name": "Trip Mates API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
