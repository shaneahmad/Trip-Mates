from fastapi import APIRouter, Depends, Query
from bson import ObjectId
from app.database import notifications_collection
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    skip = (page - 1) * limit
    cursor = notifications_collection.find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1).skip(skip).limit(limit)

    notifications = await cursor.to_list(length=limit)

    return [
        {
            "id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "message": n.get("message"),
            "reference_id": n.get("reference_id"),
            "reference_type": n.get("reference_type"),
            "sender_name": n.get("sender_name"),
            "sender_avatar": n.get("sender_avatar"),
            "read": n.get("read", False),
            "created_at": n.get("created_at"),
        }
        for n in notifications
    ]


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await notifications_collection.count_documents({
        "user_id": current_user["_id"],
        "read": False,
    })
    return {"count": count}


@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    if ObjectId.is_valid(notification_id):
        await notifications_collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": current_user["_id"]},
            {"$set": {"read": True}},
        )
    return {"success": True}


@router.put("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    await notifications_collection.update_many(
        {"user_id": current_user["_id"], "read": False},
        {"$set": {"read": True}},
    )
    return {"success": True}
