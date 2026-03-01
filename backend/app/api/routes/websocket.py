"""
WebSocket endpoint – broadcasts real-time metrics to connected dashboards.
"""

import asyncio
import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.database import execute_proc

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Connection Manager ────────────────────────────────────────────────────────
class ConnectionManager:
    """Tracks active WebSocket connections."""

    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info("WS client connected. Total: %d", len(self.active))

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)
        logger.info("WS client disconnected. Total: %d", len(self.active))

    async def broadcast(self, data: dict):
        """Send JSON to all connected clients."""
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()


# ── Background broadcaster ───────────────────────────────────────────────────
_broadcast_task: asyncio.Task | None = None


async def _broadcast_loop():
    """Fetch latest metrics every 3 seconds and broadcast to all WS clients."""
    while True:
        try:
            if manager.active:
                # Get all servers
                servers = await execute_proc("GetAllServers")
                payload = []
                for srv in servers:
                    metrics = await execute_proc("GetLatestMetrics", (srv["server_id"],))
                    latest = metrics[0] if metrics else None
                    payload.append({
                        "server_id": srv["server_id"],
                        "hostname": srv["hostname"],
                        "status": srv["status"],
                        "cpu": float(latest["cpu_percent"]) if latest else 0,
                        "ram": float(latest["ram_percent"]) if latest else 0,
                        "disk": float(latest["disk_percent"]) if latest else 0,
                        "recorded_at": latest["recorded_at"].isoformat()
                            if latest and isinstance(latest["recorded_at"], datetime)
                            else str(latest["recorded_at"]) if latest else None,
                    })
                await manager.broadcast({"type": "metrics", "servers": payload})
        except Exception as exc:
            logger.error("WS broadcast error: %s", exc)
        await asyncio.sleep(3)


def start_ws_broadcaster():
    """Start the WebSocket broadcast background task."""
    global _broadcast_task
    if _broadcast_task is None or _broadcast_task.done():
        _broadcast_task = asyncio.create_task(_broadcast_loop())
        logger.info("WebSocket broadcaster started.")


def stop_ws_broadcaster():
    """Stop the WebSocket broadcast background task."""
    global _broadcast_task
    if _broadcast_task and not _broadcast_task.done():
        _broadcast_task.cancel()
        logger.info("WebSocket broadcaster stopped.")


# ── WebSocket Route ───────────────────────────────────────────────────────────
@router.websocket("/ws/metrics")
async def websocket_metrics(ws: WebSocket):
    """
    Clients connect here to receive live metric updates.
    The broadcast loop pushes data; clients can also send messages (ignored for now).
    """
    await manager.connect(ws)
    try:
        while True:
            # Keep connection alive — listen for client pings/messages
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
