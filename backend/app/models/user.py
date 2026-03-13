from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    travel_style: Optional[str] = None  # e.g., "backpacker", "luxury", "adventure"
    interests: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    countries_visited: Optional[list[str]] = None
    bucket_list: Optional[list[str]] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    travel_style: Optional[str] = None
    interests: list[str] = []
    languages: list[str] = []
    countries_visited: list[str] = []
    bucket_list: list[str] = []
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    created_at: Optional[datetime] = None
    trips_count: int = 0
    companions_count: int = 0


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


def user_doc_to_response(user: dict) -> UserResponse:
    """Convert a MongoDB user document to a UserResponse."""
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        bio=user.get("bio"),
        avatar_url=user.get("avatar_url"),
        cover_url=user.get("cover_url"),
        date_of_birth=user.get("date_of_birth"),
        gender=user.get("gender"),
        location=user.get("location"),
        travel_style=user.get("travel_style"),
        interests=user.get("interests", []),
        languages=user.get("languages", []),
        countries_visited=user.get("countries_visited", []),
        bucket_list=user.get("bucket_list", []),
        instagram=user.get("instagram"),
        twitter=user.get("twitter"),
        website=user.get("website"),
        created_at=user.get("created_at"),
        trips_count=user.get("trips_count", 0),
        companions_count=user.get("companions_count", 0),
    )
