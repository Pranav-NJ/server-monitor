"""
Log viewer & uptime history routes — paginated log browsing + uptime data.
"""

from fastapi import APIRouter, Depends, Query
from app.core.database import execute_proc
from app.core.security import get_current_user

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/")
async def get_paginated_logs(
    log_type: str = Query("alerts", regex="^(alerts|sms|email|audit)$"),
    severity: str = Query("ALL", regex="^(ALL|CRITICAL|WARNING|INFO)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Paginated log viewer.
    Calls GetPaginatedLogs stored procedure which returns two result-sets:
    1. The paginated rows
    2. The total count
    """
    # aiomysql returns both result-sets as a flat list; the proc uses SQL_CALC_FOUND_ROWS
    # so we need to call two separate queries
    from app.core.database import get_pool
    import aiomysql

    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.callproc("GetPaginatedLogs", (log_type, severity, page, page_size))
            rows = await cur.fetchall()

            # Move to second result-set for total count
            await cur.nextset()
            count_row = await cur.fetchone()
            total = count_row["total_count"] if count_row else 0

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "data": rows,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_rows": total,
            "total_pages": total_pages,
        },
    }


@router.get("/counts")
async def get_log_counts(current_user: dict = Depends(get_current_user)):
    """Quick badge counts for each log type."""
    rows = await execute_proc("GetLogCounts")
    return rows[0] if rows else {}


@router.get("/uptime/{server_id}")
async def get_uptime_history(
    server_id: int,
    hours: int = Query(48, ge=1, le=720),
    current_user: dict = Depends(get_current_user),
):
    """
    Hourly uptime history for a server.
    Returns hour buckets with UP/DOWN status and avg metrics.
    """
    rows = await execute_proc("GetUptimeHistory", (server_id, hours))
    return rows
