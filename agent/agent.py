"""
Server Monitoring Agent
Collects CPU, RAM, and Disk usage every 10 seconds using psutil
and sends metrics to the backend API.
"""

import time
import sys
import os
import logging
import platform
import socket
import requests
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
SERVER_ID = int(os.getenv("SERVER_ID", "0"))
COLLECT_INTERVAL = int(os.getenv("COLLECT_INTERVAL", "10"))  # seconds
REGISTER_ON_START = os.getenv("REGISTER_ON_START", "true").lower() == "true"

# Auth (optional – metrics endpoint is open by default)
API_USERNAME = os.getenv("API_USERNAME", "")
API_PASSWORD = os.getenv("API_PASSWORD", "")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
)
logger = logging.getLogger("agent")


def get_auth_token() -> str | None:
    """Obtain a JWT token if credentials are configured."""
    if not API_USERNAME or not API_PASSWORD:
        return None
    try:
        resp = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"username": API_USERNAME, "password": API_PASSWORD},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]
    except Exception as exc:
        logger.warning("Auth failed: %s", exc)
        return None


def register_server(token: str | None) -> int:
    """Auto-register this machine as a server and return server_id."""
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    os_info = f"{platform.system()} {platform.release()}"

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        resp = requests.post(
            f"{API_BASE_URL}/servers/",
            json={"hostname": hostname, "ip_address": ip, "os_info": os_info},
            headers=headers,
            timeout=10,
        )
        if resp.status_code == 201:
            sid = resp.json()["server_id"]
            logger.info("Registered as server_id=%d (hostname=%s)", sid, hostname)
            return sid
        elif resp.status_code == 409:
            logger.info("Server '%s' already registered.", hostname)
            # Fall through – caller should set SERVER_ID in env
        else:
            logger.error("Registration failed: %s %s", resp.status_code, resp.text)
    except Exception as exc:
        logger.error("Registration request error: %s", exc)
    return 0


def collect_metrics() -> dict:
    """Collect system metrics using psutil."""
    import psutil

    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent
        if platform.system() != "Windows"
        else psutil.disk_usage("C:\\").percent,
    }


def send_metrics(server_id: int, metrics: dict) -> bool:
    """POST metrics to the backend API."""
    payload = {"server_id": server_id, **metrics}
    try:
        resp = requests.post(
            f"{API_BASE_URL}/metrics/",
            json=payload,
            timeout=10,
        )
        if resp.status_code == 201:
            logger.info(
                "Sent → CPU=%.1f%% RAM=%.1f%% Disk=%.1f%%",
                metrics["cpu_percent"],
                metrics["ram_percent"],
                metrics["disk_percent"],
            )
            return True
        else:
            logger.warning("API responded %d: %s", resp.status_code, resp.text)
            return False
    except requests.RequestException as exc:
        logger.error("Failed to send metrics: %s", exc)
        return False


def main():
    global SERVER_ID

    logger.info("=== Server Monitoring Agent ===")
    logger.info("API endpoint : %s", API_BASE_URL)
    logger.info("Interval     : %d seconds", COLLECT_INTERVAL)

    token = get_auth_token()

    # Auto-register if needed
    if SERVER_ID == 0 and REGISTER_ON_START:
        SERVER_ID = register_server(token)

    if SERVER_ID == 0:
        logger.error(
            "SERVER_ID is not set and auto-registration failed. "
            "Set SERVER_ID in .env or ensure API is reachable."
        )
        sys.exit(1)

    logger.info("Monitoring server_id=%d", SERVER_ID)

    # ── Collection loop ──────────────────────────────────────────────────────
    while True:
        try:
            metrics = collect_metrics()
            send_metrics(SERVER_ID, metrics)
        except KeyboardInterrupt:
            logger.info("Agent stopped by user.")
            break
        except Exception as exc:
            logger.error("Unexpected error: %s", exc)

        time.sleep(COLLECT_INTERVAL)


if __name__ == "__main__":
    main()
