"""
Async MySQL connection pool using aiomysql.
"""

import aiomysql
import logging
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_pool: aiomysql.Pool | None = None


async def init_db_pool() -> None:
    """Create the global connection pool."""
    global _pool
    settings = get_settings()
    _pool = await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        minsize=2,
        maxsize=10,
        autocommit=True,
        charset="utf8mb4",
    )
    logger.info("Database connection pool created.")


async def close_db_pool() -> None:
    """Gracefully close the pool."""
    global _pool
    if _pool:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
        logger.info("Database connection pool closed.")


async def get_pool() -> aiomysql.Pool:
    """Return the active pool; raise if not initialised."""
    if _pool is None:
        raise RuntimeError("Database pool not initialised. Call init_db_pool() first.")
    return _pool


async def execute_proc(proc_name: str, args: tuple = ()) -> list[dict]:
    """
    Execute a stored procedure and return all rows as list of dicts.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.callproc(proc_name, args)
            rows = await cur.fetchall()
            return rows


async def execute_query(query: str, args: tuple = ()) -> list[dict]:
    """Execute a raw SQL query and return rows."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, args)
            rows = await cur.fetchall()
            return rows


async def execute_insert(query: str, args: tuple = ()) -> int:
    """Execute an INSERT and return last_insert_id."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, args)
            return cur.lastrowid
