from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DB_NAME]

# Collection references
users_collection = db["users"]
trips_collection = db["trips"]
posts_collection = db["posts"]
matches_collection = db["matches"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]
notifications_collection = db["notifications"]


async def create_indexes():
    """Create database indexes for performance."""
    await users_collection.create_index("email", unique=True)
    await trips_collection.create_index([("destination", 1), ("start_date", 1)])
    await trips_collection.create_index("creator_id")
    await matches_collection.create_index([("user_id", 1), ("target_id", 1)], unique=True)
    await messages_collection.create_index([("conversation_id", 1), ("created_at", 1)])
    await notifications_collection.create_index([("user_id", 1), ("created_at", -1)])
    await posts_collection.create_index([("created_at", -1)])
