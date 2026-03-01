"""
FastAPI application entry-point.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db_pool, close_db_pool
from app.api.routes import auth, servers, metrics, alerts, logs
from app.api.routes.websocket import router as ws_router, start_ws_broadcaster, stop_ws_broadcaster
from app.services.alert_poller import start_alert_poller, stop_alert_poller

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting Server Monitor API…")
    await init_db_pool()
    start_alert_poller()
    start_ws_broadcaster()
    yield
    stop_ws_broadcaster()
    stop_alert_poller()
    await close_db_pool()
    logger.info("Server Monitor API shut down.")


# ── App ───────────────────────────────────────────────────────────────────────
settings = get_settings()

app = FastAPI(
    title="Server Monitor API",
    version="1.0.0",
    description="Database-centric server monitoring system with SMS alerting",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(servers.router, prefix=API_PREFIX)
app.include_router(metrics.router, prefix=API_PREFIX)
app.include_router(alerts.router, prefix=API_PREFIX)
app.include_router(logs.router, prefix=API_PREFIX)
app.include_router(ws_router)  # WebSocket — no prefix


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "server-monitor-api"}
