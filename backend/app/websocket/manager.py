from fastapi import WebSocket
from typing import Dict, Set
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""

    def __init__(self):
        # Map conversation_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Map user_id -> WebSocket connection (for notifications)
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()
        self.active_connections[conversation_id].add(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].discard(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        self.user_connections.pop(user_id, None)

    async def send_to_conversation(self, conversation_id: str, message: dict, exclude: WebSocket | None = None):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_json(message)
            except Exception:
                self.user_connections.pop(user_id, None)

    async def broadcast(self, message: dict):
        for user_id, connection in list(self.user_connections.items()):
            try:
                await connection.send_json(message)
            except Exception:
                self.user_connections.pop(user_id, None)


manager = ConnectionManager()
