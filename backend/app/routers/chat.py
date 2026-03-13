from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from bson import ObjectId
from datetime import datetime, timezone
from app.database import conversations_collection, messages_collection
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.models.chat import MessageCreate, MessageResponse, ConversationResponse
from app.websocket.manager import manager

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = conversations_collection.find({
        "participants.user_id": user_id,
    }).sort("updated_at", -1)

    conversations = await cursor.to_list(length=50)

    result = []
    for conv in conversations:
        # Count unread messages
        unread = await messages_collection.count_documents({
            "conversation_id": str(conv["_id"]),
            "sender_id": {"$ne": user_id},
            "read": False,
        })

        result.append(ConversationResponse(
            id=str(conv["_id"]),
            participants=conv.get("participants", []),
            last_message=conv.get("last_message"),
            unread_count=unread,
            created_at=conv.get("created_at"),
            updated_at=conv.get("updated_at"),
        ))

    return result


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    # Verify user is a participant
    conv = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_id = str(current_user["_id"])
    if not any(p.get("user_id") == user_id for p in conv.get("participants", [])):
        raise HTTPException(status_code=403, detail="Not a participant")

    skip = (page - 1) * limit
    cursor = messages_collection.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", -1).skip(skip).limit(limit)

    messages = await cursor.to_list(length=limit)

    # Mark messages as read
    await messages_collection.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": user_id},
            "read": False,
        },
        {"$set": {"read": True}},
    )

    return [
        MessageResponse(
            id=str(m["_id"]),
            conversation_id=m["conversation_id"],
            sender_id=m["sender_id"],
            sender_name=m.get("sender_name", "Unknown"),
            sender_avatar=m.get("sender_avatar"),
            content=m["content"],
            read=m.get("read", False),
            created_at=m.get("created_at"),
        )
        for m in reversed(messages)  # Return in chronological order
    ]


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str, token: str = Query(...)):
    # Authenticate via token query param
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify conversation exists and user is a participant
    from app.database import users_collection
    conv = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conv or not any(p.get("user_id") == user_id for p in conv.get("participants", [])):
        await websocket.close(code=4003, reason="Forbidden")
        return

    # Get user info
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user_name = user.get("full_name", "Unknown") if user else "Unknown"
    user_avatar = user.get("avatar_url") if user else None

    await manager.connect(websocket, conversation_id, user_id)

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()

            if not content:
                continue

            # Save message to DB
            message_doc = {
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "sender_avatar": user_avatar,
                "content": content,
                "read": False,
                "created_at": datetime.now(timezone.utc),
            }
            result = await messages_collection.insert_one(message_doc)

            # Update conversation's last message
            await conversations_collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$set": {
                        "last_message": {
                            "content": content,
                            "sender_id": user_id,
                            "sender_name": user_name,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        },
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )

            # Broadcast to all participants in the conversation
            msg_response = {
                "type": "message",
                "id": str(result.inserted_id),
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "sender_avatar": user_avatar,
                "content": content,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await manager.send_to_conversation(conversation_id, msg_response)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id, user_id)
    except Exception:
        manager.disconnect(websocket, conversation_id, user_id)
