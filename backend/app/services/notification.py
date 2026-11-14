import asyncio
import json
from typing import Set, Dict, Any
from datetime import datetime

class NotificationBroadcaster:
    """Manages real-time Server-Sent Events (SSE) connections for live notifications."""
    def __init__(self):
        self._listeners: Set[asyncio.Queue] = set()

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._listeners.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._listeners.discard(queue)

    async def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        """Broadcasts event to all active SSE listener queues."""
        if not self._listeners:
            return
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        for queue in list(self._listeners):
            try:
                queue.put_nowait(payload)
            except Exception:
                self._listeners.discard(queue)

notification_broadcaster = NotificationBroadcaster()

