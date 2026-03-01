"""
Email Service – Sends alert emails via SendGrid (mock-safe).
"""

import logging
from app.core.config import get_settings
from app.core.database import execute_proc

logger = logging.getLogger(__name__)


class EmailService:
    """
    Encapsulates SendGrid email dispatch and logging.
    Falls back to mock mode when SendGrid credentials are not configured.
    """

    def __init__(self):
        self.settings = get_settings()
        self._sg_client = None

        if self.settings.SENDGRID_API_KEY and not self.settings.SENDGRID_API_KEY.startswith("SG.xx"):
            try:
                from sendgrid import SendGridAPIClient
                self._sg_client = SendGridAPIClient(self.settings.SENDGRID_API_KEY)
                logger.info("SendGrid client initialised (live mode).")
            except Exception as exc:
                logger.warning("SendGrid init failed, falling back to mock: %s", exc)
        else:
            logger.info("SendGrid API key not set – running in MOCK EMAIL mode.")

    async def send_alert_email(self, alert: dict) -> int:
        """
        Send email for a single alert. Returns 1 if sent, 0 otherwise.
        """
        subject = (
            f"[{alert['severity']}] {alert['metric_name']} alert on "
            f"{alert.get('hostname', 'unknown')}"
        )
        body = self._build_email_body(alert)
        recipient = self.settings.EMAIL_RECIPIENT

        if not recipient:
            logger.warning("EMAIL_RECIPIENT not configured, skipping email.")
            return 0

        try:
            await self._send_email(recipient, subject, body)
            await execute_proc(
                "LogEmail",
                (
                    alert["alert_id"],
                    recipient,
                    subject,
                    body,
                    "SENT",
                ),
            )
            logger.info(
                "Email sent for alert #%s → %s", alert["alert_id"], recipient
            )
            return 1
        except Exception as exc:
            logger.error(
                "Email dispatch failed for alert #%s: %s", alert["alert_id"], exc
            )
            await execute_proc(
                "LogEmail",
                (
                    alert["alert_id"],
                    recipient,
                    subject,
                    body,
                    "FAILED",
                ),
            )
            return 0

    async def _send_email(self, to_email: str, subject: str, body: str):
        """Send a single email via SendGrid or mock."""
        if self._sg_client:
            from sendgrid.helpers.mail import Mail, Email, To, Content

            message = Mail(
                from_email=Email(self.settings.EMAIL_FROM),
                to_emails=To(to_email),
                subject=subject,
                plain_text_content=Content("text/plain", body),
            )
            # Also add HTML version
            message.add_content(Content("text/html", self._build_html_body(body)))

            response = self._sg_client.send(message)
            logger.info(
                "SendGrid response: status=%s", response.status_code
            )
            if response.status_code not in (200, 201, 202):
                raise Exception(f"SendGrid returned status {response.status_code}")
        else:
            logger.info(
                "[MOCK EMAIL] To: %s | Subject: %s | Body: %s",
                to_email,
                subject,
                body[:100],
            )

    def _build_email_body(self, alert: dict) -> str:
        """Build plain text email body."""
        return (
            f"Server Monitor Alert\n"
            f"{'=' * 40}\n\n"
            f"Severity:  {alert['severity']}\n"
            f"Server:    {alert.get('hostname', 'unknown')}\n"
            f"Metric:    {alert['metric_name']}\n"
            f"Value:     {alert['metric_value']}%\n"
            f"Threshold: {alert['threshold']}%\n"
            f"Time:      {alert.get('created_at', 'N/A')}\n\n"
            f"Message: {alert.get('message', 'N/A')}\n\n"
            f"— Server Monitor System"
        )

    def _build_html_body(self, plain_text: str) -> str:
        """Build HTML email body from plain text."""
        lines = plain_text.replace("\n", "<br>")
        return (
            f'<div style="font-family: Arial, sans-serif; padding: 20px; '
            f'background: #0f172a; color: #e2e8f0; border-radius: 8px;">'
            f'<h2 style="color: #ef4444; margin-bottom: 16px;">'
            f"⚠ Server Monitor Alert</h2>"
            f'<div style="background: #1e293b; padding: 16px; '
            f'border-radius: 6px; border-left: 4px solid #ef4444;">'
            f"<p>{lines}</p>"
            f"</div>"
            f'<p style="color: #64748b; font-size: 12px; margin-top: 16px;">'
            f"Sent by Server Monitor System</p>"
            f"</div>"
        )
