from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database import users_collection
from app.core.dependencies import get_current_user
from app.models.user import UserProfileUpdate, UserResponse, user_doc_to_response

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_profile(current_user: dict = Depends(get_current_user)):
    return user_doc_to_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    updates: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data},
    )

    updated_user = await users_collection.find_one({"_id": current_user["_id"]})
    return user_doc_to_response(updated_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user_doc_to_response(user)
