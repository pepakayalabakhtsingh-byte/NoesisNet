import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect_to_mongo, close_mongo_connection
from app.routers import upload, graph, search, qa, evaluation, auth
from app.services.graph_service import GraphBuilder
from app.config import settings

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

app = FastAPI(title="Multi-Modal KG Compliance API", version="1.0.0")

# CORS setup
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

if settings.frontend_url:
    for url in settings.frontend_url.split(","):
        if url.strip():
            CORS_ORIGINS.append(url.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifecycle events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()
    builder = GraphBuilder()
    builder.close()

# Include routers
app.include_router(upload.router, tags=["Upload"])
app.include_router(graph.router)
app.include_router(search.router)
app.include_router(qa.router)
app.include_router(evaluation.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Compliance KG API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
