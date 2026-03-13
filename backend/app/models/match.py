from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MatchAction(BaseModel):
    target_id: str
    action: str  # "like" or "pass"


class MatchResponse(BaseModel):
    id: str
    users: list[dict]
    matched_at: Optional[datetime] = None
    conversation_id: Optional[str] = None


class DiscoverProfile(BaseModel):
    id: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    location: Optional[str] = None
    travel_style: Optional[str] = None
    interests: list[str] = []
    languages: list[str] = []
    countries_visited: list[str] = []
    bucket_list: list[str] = []
    age: Optional[int] = None
    trips_count: int = 0
    companions_count: int = 0
    compatibility_score: Optional[float] = None
