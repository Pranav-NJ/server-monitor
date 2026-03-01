"""
Server management routes.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import RegisterServerRequest, ServerResponse
from app.core.database import execute_insert, execute_proc
from app.core.security import get_current_user

router = APIRouter(prefix="/servers", tags=["Servers"])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_server(
    body: RegisterServerRequest,
    current_user: dict = Depends(get_current_user),
):
    """Register a new server to be monitored."""
    try:
        server_id = await execute_insert(
            "INSERT INTO Servers (hostname, ip_address, os_info, registered_by) "
            "VALUES (%s, %s, %s, %s)",
            (body.hostname, body.ip_address, body.os_info, current_user["user_id"]),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Server '{body.hostname}' already registered",
        )
    return {"server_id": server_id, "hostname": body.hostname}


@router.get("/", response_model=list[ServerResponse])
async def list_servers(current_user: dict = Depends(get_current_user)):
    """List all registered servers."""
    rows = await execute_proc("GetAllServers")
    return rows


@router.get("/{server_id}/health")
async def server_health(server_id: int, current_user: dict = Depends(get_current_user)):
    """Get server health by calling the stored procedure."""
    rows = await execute_proc("GetServerHealth", (server_id,))
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    return rows[0]
