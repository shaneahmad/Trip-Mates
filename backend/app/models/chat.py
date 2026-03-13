from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    content: str
    read: bool = False
    created_at: Optional[datetime] = None


class ConversationResponse(BaseModel):
    id: str
    participants: list[dict]
    last_message: Optional[dict] = None
    unread_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
