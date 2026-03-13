from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    images: list[str] = []
    location: Optional[str] = None
    trip_id: Optional[str] = None
    tags: list[str] = []


class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    images: list[str] = []
    location: Optional[str] = None
    trip_id: Optional[str] = None
    tags: list[str] = []
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    comments: list[dict] = []
    created_at: Optional[datetime] = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None


def post_doc_to_response(post: dict, user_id: str | None = None) -> PostResponse:
    """Convert a MongoDB post document to a PostResponse."""
    likes = post.get("likes", [])
    is_liked = user_id in [str(l) for l in likes] if user_id else False

    return PostResponse(
        id=str(post["_id"]),
        author_id=str(post["author_id"]),
        author_name=post.get("author_name", "Unknown"),
        author_avatar=post.get("author_avatar"),
        content=post["content"],
        images=post.get("images", []),
        location=post.get("location"),
        trip_id=str(post["trip_id"]) if post.get("trip_id") else None,
        tags=post.get("tags", []),
        likes_count=len(likes),
        comments_count=len(post.get("comments", [])),
        is_liked=is_liked,
        comments=post.get("comments", [])[:10],  # Return last 10 comments
        created_at=post.get("created_at"),
    )
