from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone
from app.database import (
    users_collection, matches_collection,
    conversations_collection, notifications_collection,
)
from app.core.dependencies import get_current_user
from app.models.match import MatchAction, MatchResponse, DiscoverProfile

router = APIRouter(prefix="/api", tags=["Matches"])


@router.get("/discover", response_model=list[DiscoverProfile])
async def discover_profiles(current_user: dict = Depends(get_current_user)):
    """Get profiles to swipe on, excluding already swiped users."""
    user_id = current_user["_id"]

    # Get IDs of users already swiped on
    swiped_cursor = matches_collection.find(
        {"user_id": user_id},
        {"target_id": 1},
    )
    swiped_docs = await swiped_cursor.to_list(length=1000)
    swiped_ids = [ObjectId(doc["target_id"]) for doc in swiped_docs]
    swiped_ids.append(user_id)  # Exclude self

    # Find profiles not yet swiped
    cursor = users_collection.find(
        {"_id": {"$nin": swiped_ids}},
    ).limit(20)

    profiles = await cursor.to_list(length=20)

    result = []
    for p in profiles:
        # Calculate a simple compatibility score based on shared interests
        my_interests = set(current_user.get("interests", []))
        their_interests = set(p.get("interests", []))
        shared = len(my_interests & their_interests)
        total = len(my_interests | their_interests) if my_interests or their_interests else 1
        score = round((shared / total) * 100, 1) if total > 0 else 0

        result.append(DiscoverProfile(
            id=str(p["_id"]),
            full_name=p.get("full_name", "Unknown"),
            bio=p.get("bio"),
            avatar_url=p.get("avatar_url"),
            cover_url=p.get("cover_url"),
            location=p.get("location"),
            travel_style=p.get("travel_style"),
            interests=p.get("interests", []),
            languages=p.get("languages", []),
            countries_visited=p.get("countries_visited", []),
            bucket_list=p.get("bucket_list", []),
            trips_count=p.get("trips_count", 0),
            companions_count=p.get("companions_count", 0),
            compatibility_score=score,
        ))

    return result


@router.post("/matches/action")
async def swipe_action(
    action_data: MatchAction,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["_id"]
    target_id = action_data.target_id

    if str(user_id) == target_id:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")

    if not ObjectId.is_valid(target_id):
        raise HTTPException(status_code=400, detail="Invalid target ID")

    # Check if already swiped
    existing = await matches_collection.find_one({
        "user_id": user_id,
        "target_id": target_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already swiped on this user")

    # Record the action
    await matches_collection.insert_one({
        "user_id": user_id,
        "target_id": target_id,
        "action": action_data.action,
        "created_at": datetime.now(timezone.utc),
    })

    # Check for mutual like (match!)
    if action_data.action == "like":
        mutual = await matches_collection.find_one({
            "user_id": ObjectId(target_id),
            "target_id": str(user_id),
            "action": "like",
        })

        if mutual:
            # Create conversation for the match
            conversation = {
                "participants": [
                    {
                        "user_id": str(user_id),
                        "full_name": current_user.get("full_name"),
                        "avatar_url": current_user.get("avatar_url"),
                    },
                    {
                        "user_id": target_id,
                        "full_name": None,  # Will be filled
                        "avatar_url": None,
                    },
                ],
                "last_message": None,
                "unread_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }

            # Get target user info
            target_user = await users_collection.find_one({"_id": ObjectId(target_id)})
            if target_user:
                conversation["participants"][1]["full_name"] = target_user.get("full_name")
                conversation["participants"][1]["avatar_url"] = target_user.get("avatar_url")

            conv_result = await conversations_collection.insert_one(conversation)

            # Create notifications for both users
            for uid, uname in [(str(user_id), current_user.get("full_name")), (target_id, target_user.get("full_name") if target_user else "Someone")]:
                other_name = uname
                other_id = target_id if uid == str(user_id) else str(user_id)
                await notifications_collection.insert_one({
                    "user_id": ObjectId(uid),
                    "type": "match",
                    "title": "New Match! 🎉",
                    "message": f"You matched with {other_name}! Start a conversation.",
                    "reference_id": str(conv_result.inserted_id),
                    "reference_type": "conversation",
                    "sender_id": other_id,
                    "sender_name": other_name,
                    "read": False,
                    "created_at": datetime.now(timezone.utc),
                })

            return {
                "matched": True,
                "conversation_id": str(conv_result.inserted_id),
                "message": "It's a match!",
            }

    return {"matched": False, "message": "Action recorded"}


@router.get("/matches", response_model=list[MatchResponse])
async def get_matches(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    # Find conversations where user is a participant
    cursor = conversations_collection.find({
        "participants.user_id": user_id,
    }).sort("updated_at", -1)

    conversations = await cursor.to_list(length=50)

    matches = []
    for conv in conversations:
        matches.append(MatchResponse(
            id=str(conv["_id"]),
            users=conv.get("participants", []),
            matched_at=conv.get("created_at"),
            conversation_id=str(conv["_id"]),
        ))

    return matches
