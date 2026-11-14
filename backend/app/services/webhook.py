import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
import httpx
from sqlalchemy.orm import Session
from app.models.notification import Notification, WebhookDelivery
from app.core.security import generate_webhook_signature
from app.security.ssrf_guard import is_safe_webhook_url
from app.core.config import settings

class WebhookDeliveryService:
    def __init__(self):
        self.timeout = settings.WEBHOOK_TIMEOUT_SECONDS
        self.max_retries = settings.WEBHOOK_MAX_RETRIES

    async def deliver_webhook_async(
        self,
        db: Session,
        notification_id: str,
        target_url: str,
        payload: Dict[str, Any],
        signing_secret: Optional[str] = None
    ) -> bool:
        """
        Delivers a signed webhook payload with SSRF checks, HMAC-SHA256 signing,
        exponential backoff retries, and persistence in WebhookDelivery table.
        """
        # 1. SSRF Validation
        is_safe, safety_msg = is_safe_webhook_url(target_url)
        if not is_safe:
            delivery_record = WebhookDelivery(
                notification_id=notification_id,
                target_url=target_url,
                payload=payload,
                signature="UNSAFE_REJECTED",
                status="FAILED",
                response_status_code=400,
                response_body=f"SSRF Check Rejected: {safety_msg}",
                attempt_number=1
            )
            db.add(delivery_record)
            db.commit()
            return False

        # 2. Serialize payload & compute signature
        payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = generate_webhook_signature(payload_bytes, signing_secret)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "AgentConnect-Webhook-Delivery/1.0",
            "X-AgentConnect-Signature": signature,
            "X-AgentConnect-Timestamp": datetime.utcnow().isoformat()
        }

        success = False
        attempt = 1
        last_error = ""
        status_code = None

        while attempt <= self.max_retries:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(target_url, headers=headers, content=payload_bytes)
                    status_code = resp.status_code
                    if 200 <= status_code < 300:
                        success = True
                        last_error = resp.text[:500]
                        break
                    else:
                        last_error = f"HTTP {status_code}: {resp.text[:300]}"
            except Exception as e:
                last_error = str(e)

            # Exponential backoff: 0.5s, 1.0s, 2.0s
            if attempt < self.max_retries:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
            attempt += 1

        # 3. Log delivery attempt
        delivery_record = WebhookDelivery(
            notification_id=notification_id,
            target_url=target_url,
            payload=payload,
            signature=signature,
            status="SUCCESS" if success else "FAILED",
            response_status_code=status_code,
            response_body=last_error,
            attempt_number=min(attempt, self.max_retries)
        )
        db.add(delivery_record)

        # Update notification status
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.status = "Delivered" if success else "Failed"
            if success:
                notif.delivered_at = datetime.utcnow()

        db.commit()
        return success

webhook_delivery_service = WebhookDeliveryService()

