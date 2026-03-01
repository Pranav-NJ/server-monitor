"""
Pydantic schemas for request / response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: Optional[str] = None
    role_id: int = 2


# ── Servers ───────────────────────────────────────────────────────────────────
class RegisterServerRequest(BaseModel):
    hostname: str = Field(min_length=1, max_length=255)
    ip_address: str = Field(min_length=7, max_length=45)
    os_info: Optional[str] = None


class ServerResponse(BaseModel):
    server_id: int
    hostname: str
    ip_address: str
    os_info: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Metrics ───────────────────────────────────────────────────────────────────
class MetricInsertRequest(BaseModel):
    server_id: int
    cpu_percent: float = Field(ge=0, le=100)
    ram_percent: float = Field(ge=0, le=100)
    disk_percent: float = Field(ge=0, le=100)


class MetricResponse(BaseModel):
    metric_id: int
    server_id: int
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    recorded_at: datetime


# ── Alerts ────────────────────────────────────────────────────────────────────
class AlertResponse(BaseModel):
    alert_id: int
    server_id: int
    hostname: Optional[str] = None
    metric_name: str
    metric_value: float
    threshold: float
    severity: str
    status: str
    message: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None


class AlertSummaryRow(BaseModel):
    severity: str
    status: str
    alert_count: int


# ── Health ────────────────────────────────────────────────────────────────────
class ServerHealthResponse(BaseModel):
    server_id: int
    hostname: str
    ip_address: str
    os_info: Optional[str] = None
    status: str
    latest_cpu: Optional[float] = None
    latest_ram: Optional[float] = None
    latest_disk: Optional[float] = None
    last_seen: Optional[datetime] = None
    active_alerts: int = 0
