"""
Alert management routes.
"""

from fastapi import APIRouter, Depends, Query
from app.core.database import execute_proc
from app.core.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Paginated alert history (calls stored procedure)."""
    rows = await execute_proc("GetAlerts", (limit, offset))
    return rows


@router.get("/summary")
async def alert_summary(current_user: dict = Depends(get_current_user)):
    """Aggregated alert counts by severity/status."""
    rows = await execute_proc("GetAlertSummary")
    return rows


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, current_user: dict = Depends(get_current_user)):
    """Resolve an alert (calls stored procedure with transaction)."""
    rows = await execute_proc("ResolveAlert", (alert_id, current_user["user_id"]))
    return rows[0] if rows else {"alert_id": alert_id, "status": "RESOLVED"}
