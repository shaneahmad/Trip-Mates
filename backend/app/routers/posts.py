from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from app.database import posts_collection, users_collection
from app.core.dependencies import get_current_user
from app.models.post import PostCreate, PostResponse, CommentCreate, post_doc_to_response

router = APIRouter(prefix="/api/posts", tags=["Posts"])


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: dict = Depends(get_current_user),
):
    post_doc = {
        "author_id": current_user["_id"],
        "author_name": current_user.get("full_name", "Unknown"),
        "author_avatar": current_user.get("avatar_url"),
        "content": post_data.content,
        "images": post_data.images,
        "location": post_data.location,
        "trip_id": ObjectId(post_data.trip_id) if post_data.trip_id else None,
        "tags": post_data.tags,
        "likes": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc),
    }

    result = await posts_collection.insert_one(post_doc)
    post_doc["_id"] = result.inserted_id

    return post_doc_to_response(post_doc, str(current_user["_id"]))


@router.get("", response_model=list[PostResponse])
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    skip = (page - 1) * limit
    cursor = posts_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    user_id = str(current_user["_id"])
    return [post_doc_to_response(p, user_id) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post_doc_to_response(post, str(current_user["_id"]))


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_id = current_user["_id"]
    likes = post.get("likes", [])

    if user_id in likes:
        await posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"likes": user_id}},
        )
        return {"liked": False}
    else:
        await posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"likes": user_id}},
        )
        return {"liked": True}


@router.post("/{post_id}/comment")
async def add_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = {
        "id": str(ObjectId()),
        "author_id": str(current_user["_id"]),
        "author_name": current_user.get("full_name", "Unknown"),
        "author_avatar": current_user.get("avatar_url"),
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"comments": comment}},
    )

    return comment


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if str(post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not the post author")

    await posts_collection.delete_one({"_id": ObjectId(post_id)})
