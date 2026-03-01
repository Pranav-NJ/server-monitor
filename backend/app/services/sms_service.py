"""
SMS Service – Polls pending alerts and dispatches via Twilio (mock-safe).
"""

import logging
from app.core.config import get_settings
from app.core.database import execute_proc

logger = logging.getLogger(__name__)


class SMSService:
    """
    Encapsulates Twilio SMS dispatch and logging.
    Falls back to mock mode when Twilio credentials are not configured.
    """

    def __init__(self):
        self.settings = get_settings()
        self._client = None

        if self.settings.TWILIO_ACCOUNT_SID and not self.settings.TWILIO_ACCOUNT_SID.startswith("ACxx"):
            try:
                from twilio.rest import Client
                self._client = Client(
                    self.settings.TWILIO_ACCOUNT_SID,
                    self.settings.TWILIO_AUTH_TOKEN,
                )
                logger.info("Twilio client initialised (live mode).")
            except Exception as exc:
                logger.warning("Twilio init failed, falling back to mock: %s", exc)
        else:
            logger.info("Twilio credentials not set – running in MOCK SMS mode.")

    async def poll_and_send(self) -> int:
        """
        Main loop step: fetch PENDING alerts, send SMS, mark SENT, log.
        Returns number of alerts processed.
        """
        pending = await execute_proc("GetPendingAlerts")
        if not pending:
            return 0

        processed = 0
        for alert in pending:
            try:
                sid = await self._send_sms(alert)
                await execute_proc("MarkAlertSent", (alert["alert_id"],))
                await execute_proc(
                    "LogSMS",
                    (
                        alert["alert_id"],
                        self.settings.SMS_RECIPIENT_NUMBER,
                        alert["message"] or "",
                        sid,
                        "SENT",
                    ),
                )
                processed += 1
                logger.info("SMS sent for alert #%s → sid=%s", alert["alert_id"], sid)
            except Exception as exc:
                logger.error("SMS dispatch failed for alert #%s: %s", alert["alert_id"], exc)
                await execute_proc(
                    "LogSMS",
                    (
                        alert["alert_id"],
                        self.settings.SMS_RECIPIENT_NUMBER,
                        alert.get("message", ""),
                        "",
                        "FAILED",
                    ),
                )

        return processed

    async def _send_sms(self, alert: dict) -> str:
        """Send a single SMS. Returns Twilio SID or mock SID."""
        body = (
            f"[{alert['severity']}] {alert['metric_name']}={alert['metric_value']}% "
            f"(threshold {alert['threshold']}%) on {alert.get('hostname', 'unknown')}"
        )

        if self._client:
            message = self._client.messages.create(
                body=body,
                from_=self.settings.TWILIO_FROM_NUMBER,
                to=self.settings.SMS_RECIPIENT_NUMBER,
            )
            return message.sid
        else:
            mock_sid = f"MOCK_SID_{alert['alert_id']}"
            logger.info("[MOCK SMS] To: %s | Body: %s", self.settings.SMS_RECIPIENT_NUMBER, body)
            return mock_sid
