from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from app.database import trips_collection, users_collection, notifications_collection
from app.core.dependencies import get_current_user
from app.models.trip import TripCreate, TripUpdate, TripResponse, trip_doc_to_response

router = APIRouter(prefix="/api/trips", tags=["Trips"])


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user: dict = Depends(get_current_user),
):
    trip_doc = {
        "creator_id": current_user["_id"],
        "creator_name": current_user.get("full_name", "Unknown"),
        "creator_avatar": current_user.get("avatar_url"),
        "title": trip_data.title,
        "description": trip_data.description,
        "destination": trip_data.destination,
        "cover_image": trip_data.cover_image,
        "start_date": trip_data.start_date,
        "end_date": trip_data.end_date,
        "budget_min": trip_data.budget_min,
        "budget_max": trip_data.budget_max,
        "budget_currency": trip_data.budget_currency,
        "max_companions": trip_data.max_companions,
        "companions": [],
        "join_requests": [],
        "tags": trip_data.tags,
        "activities": trip_data.activities,
        "accommodation_type": trip_data.accommodation_type,
        "status": "planning",
        "created_at": datetime.now(timezone.utc),
    }

    result = await trips_collection.insert_one(trip_doc)
    trip_doc["_id"] = result.inserted_id

    # Increment user's trip count
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"trips_count": 1}},
    )

    return trip_doc_to_response(trip_doc, str(current_user["_id"]))


@router.get("", response_model=list[TripResponse])
async def list_trips(
    destination: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    budget_max: Optional[float] = Query(None),
    tags: Optional[str] = Query(None),  # comma-separated
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    query = {"status": {"$ne": "cancelled"}}

    if destination:
        query["destination"] = {"$regex": destination, "$options": "i"}
    if start_date:
        query["start_date"] = {"$gte": start_date}
    if end_date:
        query["end_date"] = {"$lte": end_date}
    if budget_max:
        query["budget_max"] = {"$lte": budget_max}
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}

    skip = (page - 1) * limit
    cursor = trips_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    trips = await cursor.to_list(length=limit)

    user_id = str(current_user["_id"])
    return [trip_doc_to_response(t, user_id) for t in trips]


@router.get("/my-trips", response_model=list[TripResponse])
async def get_my_trips(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    cursor = trips_collection.find({
        "$or": [
            {"creator_id": user_id},
            {"companions.user_id": str(user_id)},
        ]
    }).sort("created_at", -1)

    trips = await cursor.to_list(length=100)
    return [trip_doc_to_response(t, str(user_id)) for t in trips]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip_doc_to_response(trip, str(current_user["_id"]))


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    updates: TripUpdate,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if str(trip["creator_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not the trip owner")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await trips_collection.update_one({"_id": ObjectId(trip_id)}, {"$set": update_data})
    updated = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    return trip_doc_to_response(updated, str(current_user["_id"]))


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if str(trip["creator_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not the trip owner")

    await trips_collection.delete_one({"_id": ObjectId(trip_id)})
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"trips_count": -1}},
    )


@router.post("/{trip_id}/join", status_code=status.HTTP_200_OK)
async def request_join_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    user_id = str(current_user["_id"])
    if str(trip["creator_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot join your own trip")

    # Check if already a companion
    if any(c.get("user_id") == user_id for c in trip.get("companions", [])):
        raise HTTPException(status_code=400, detail="Already a companion")

    if len(trip.get("companions", [])) >= trip.get("max_companions", 5):
        raise HTTPException(status_code=400, detail="Trip is full")

    # Add to companions directly (could add approval flow later)
    companion = {
        "user_id": user_id,
        "full_name": current_user.get("full_name", "Unknown"),
        "avatar_url": current_user.get("avatar_url"),
        "joined_at": datetime.now(timezone.utc).isoformat(),
    }

    await trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$push": {"companions": companion}},
    )

    # Create notification for trip creator
    notification = {
        "user_id": trip["creator_id"],
        "type": "trip_join",
        "title": f"{current_user.get('full_name', 'Someone')} joined your trip",
        "message": f"joined your trip \"{trip['title']}\"",
        "reference_id": trip_id,
        "reference_type": "trip",
        "sender_id": user_id,
        "sender_name": current_user.get("full_name"),
        "sender_avatar": current_user.get("avatar_url"),
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    await notifications_collection.insert_one(notification)

    # Update companions count
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"companions_count": 1}},
    )

    return {"message": "Joined trip successfully"}
