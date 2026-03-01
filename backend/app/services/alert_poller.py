"""
Background alert poller – runs on a periodic schedule.
"""

import asyncio
import logging
from app.services.sms_service import SMSService
from app.services.email_service import EmailService
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_task: asyncio.Task | None = None
_sms_service: SMSService | None = None
_email_service: EmailService | None = None


async def _poll_loop():
    """Continuously poll for pending alerts and dispatch Email + SMS."""
    settings = get_settings()
    global _sms_service, _email_service
    _sms_service = SMSService()
    _email_service = EmailService()

    while True:
        try:
            from app.core.database import execute_proc

            # 1) Fetch pending alerts ONCE
            pending = await execute_proc("GetPendingAlerts")
            if pending:
                # 2) Send emails FIRST (does NOT mark alerts as SENT)
                email_count = 0
                for alert in pending:
                    try:
                        email_count += await _email_service.send_alert_email(alert)
                    except Exception as exc:
                        logger.error("Email for alert #%s failed: %s", alert["alert_id"], exc)
                if email_count:
                    logger.info("Alert poller dispatched %d email(s).", email_count)

                # 3) Send SMS + mark SENT (re-fetches same pending alerts)
                sms_count = await _sms_service.poll_and_send()
                if sms_count:
                    logger.info("Alert poller dispatched %d SMS(es).", sms_count)

        except Exception as exc:
            logger.error("Alert poller error: %s", exc)

        await asyncio.sleep(settings.ALERT_POLL_INTERVAL_SECONDS)


def start_alert_poller():
    """Start the background poller task."""
    global _task
    if _task is None or _task.done():
        _task = asyncio.create_task(_poll_loop())
        logger.info("Alert poller started.")


def stop_alert_poller():
    """Cancel the background poller."""
    global _task
    if _task and not _task.done():
        _task.cancel()
        logger.info("Alert poller stopped.")
