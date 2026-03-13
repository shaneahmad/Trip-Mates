from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from app.database import users_collection
from app.models.user import (
    UserCreate, UserLogin, TokenResponse, RefreshTokenRequest,
    user_doc_to_response,
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    # Check existing
    existing = await users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user document
    user_doc = {
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "bio": None,
        "avatar_url": None,
        "cover_url": None,
        "date_of_birth": None,
        "gender": None,
        "location": None,
        "travel_style": None,
        "interests": [],
        "languages": [],
        "countries_visited": [],
        "bucket_list": [],
        "instagram": None,
        "twitter": None,
        "website": None,
        "trips_count": 0,
        "companions_count": 0,
        "created_at": datetime.now(timezone.utc),
    }

    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Generate tokens
    token_data = {"sub": str(result.inserted_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_doc_to_response(user_doc),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_data = {"sub": str(user["_id"])}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_doc_to_response(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    from bson import ObjectId
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    token_data = {"sub": str(user["_id"])}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user_doc_to_response(user),
    )
