import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.mongodb_uri)
    db_instance.db = db_instance.client[settings.database_name]
    logger.info("Connected to MongoDB.")
    
    # Initialize collections and indexes
    await init_db()

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
    logger.info("Closed MongoDB connection.")

async def init_db():
    db = db_instance.db
    # Create indexes for documents
    await db.documents.create_index("category")
    await db.documents.create_index("created_at")
    await db.documents.create_index("status")
    
    # Create indexes for processing_jobs
    await db.processing_jobs.create_index("job_id", unique=True)
    await db.processing_jobs.create_index("document_id")

def get_db():
    return db_instance.db

def get_gridfs_bucket() -> AsyncIOMotorGridFSBucket:
    return AsyncIOMotorGridFSBucket(db_instance.db, bucket_name="uploads")
