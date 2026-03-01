"""
Metrics ingestion & retrieval routes.
"""

from fastapi import APIRouter, Depends, Query
from app.schemas.schemas import MetricInsertRequest
from app.core.database import execute_insert, execute_proc
from app.core.security import get_current_user

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.post("/", status_code=201)
async def insert_metric(body: MetricInsertRequest):
    """
    Ingest a metric data point.
    NOTE: No auth required – the monitoring agent calls this endpoint.
    The MySQL trigger will evaluate alert rules automatically.
    """
    metric_id = await execute_insert(
        "INSERT INTO Metrics (server_id, cpu_percent, ram_percent, disk_percent) "
        "VALUES (%s, %s, %s, %s)",
        (body.server_id, body.cpu_percent, body.ram_percent, body.disk_percent),
    )
    return {"metric_id": metric_id, "status": "recorded"}


@router.get("/{server_id}/latest")
async def latest_metrics(server_id: int, current_user: dict = Depends(get_current_user)):
    """Fetch latest 50 metrics for charts (calls stored procedure)."""
    rows = await execute_proc("GetLatestMetrics", (server_id,))
    return rows


@router.get("/{server_id}/history")
async def metric_history(
    server_id: int,
    range: str = Query("1h", regex="^(1h|6h|24h|7d)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch aggregated metric history for charting.
    Range options: 1h, 6h, 24h, 7d
    Data is automatically bucketed (raw → per-min → per-5min → per-hour)
    using the GetMetricHistory stored procedure.
    """
    hours_map = {"1h": 1, "6h": 6, "24h": 24, "7d": 168}
    hours = hours_map[range]
    rows = await execute_proc("GetMetricHistory", (server_id, hours))
    return rows
