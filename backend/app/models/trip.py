from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TripCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    destination: str = Field(..., min_length=2)
    cover_image: Optional[str] = None
    start_date: str  # ISO date string
    end_date: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str = "USD"
    max_companions: int = Field(default=5, ge=1, le=50)
    tags: list[str] = []
    activities: list[str] = []
    accommodation_type: Optional[str] = None  # hostel, hotel, airbnb, camping


class TripUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    destination: Optional[str] = None
    cover_image: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: Optional[str] = None
    max_companions: Optional[int] = None
    tags: Optional[list[str]] = None
    activities: Optional[list[str]] = None
    accommodation_type: Optional[str] = None
    status: Optional[str] = None  # planning, active, completed, cancelled


class TripResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: str
    creator_avatar: Optional[str] = None
    title: str
    description: str
    destination: str
    cover_image: Optional[str] = None
    start_date: str
    end_date: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str = "USD"
    max_companions: int = 5
    current_companions: int = 0
    companions: list[dict] = []
    tags: list[str] = []
    activities: list[str] = []
    accommodation_type: Optional[str] = None
    status: str = "planning"
    created_at: Optional[datetime] = None
    is_joined: bool = False
    join_requests: list[dict] = []


class TripSearchParams(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_max: Optional[float] = None
    tags: Optional[list[str]] = None
    page: int = 1
    limit: int = 20


def trip_doc_to_response(trip: dict, user_id: str | None = None) -> TripResponse:
    """Convert a MongoDB trip document to a TripResponse."""
    companions = trip.get("companions", [])
    is_joined = any(str(c.get("user_id")) == user_id for c in companions) if user_id else False

    return TripResponse(
        id=str(trip["_id"]),
        creator_id=str(trip["creator_id"]),
        creator_name=trip.get("creator_name", "Unknown"),
        creator_avatar=trip.get("creator_avatar"),
        title=trip["title"],
        description=trip["description"],
        destination=trip["destination"],
        cover_image=trip.get("cover_image"),
        start_date=trip["start_date"],
        end_date=trip["end_date"],
        budget_min=trip.get("budget_min"),
        budget_max=trip.get("budget_max"),
        budget_currency=trip.get("budget_currency", "USD"),
        max_companions=trip.get("max_companions", 5),
        current_companions=len(companions),
        companions=companions,
        tags=trip.get("tags", []),
        activities=trip.get("activities", []),
        accommodation_type=trip.get("accommodation_type"),
        status=trip.get("status", "planning"),
        created_at=trip.get("created_at"),
        is_joined=is_joined,
        join_requests=trip.get("join_requests", []) if str(trip.get("creator_id")) == user_id else [],
    )
