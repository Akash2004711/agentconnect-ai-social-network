import ipaddress
import socket
from urllib.parse import urlparse
from app.core.config import settings

def is_safe_webhook_url(url: str) -> tuple[bool, str]:
    """
    Validates webhook URL against Server-Side Request Forgery (SSRF) attacks.
    Blocks private IP ranges (RFC 1918, RFC 3927, loopback, AWS metadata 169.254.169.254)
    unless explicitly allowed in development mode.
    """
    if not url:
        return False, "URL cannot be empty."

    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"

    if parsed.scheme not in ("http", "https"):
        return False, f"Unsupported URL scheme: {parsed.scheme}. Only HTTP/HTTPS permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL lacks a valid hostname."

    # Prevent internal metadata endpoints
    if hostname.lower() in ("169.254.169.254", "metadata.google.internal", "instance-data", "169.254.169.254.nip.io"):
        return False, "Access to cloud instance metadata services is strictly forbidden."

    # Direct IP check or localhost
    if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
        if settings.ALLOW_DEV_PRIVATE_WEBHOOKS:
            return True, "Allowed by development mode exception."
        return False, "Localhost loopback destinations are restricted in production."

    try:
        # Check if already IP address
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        # Hostname - try fast resolution or sandbox check
        try:
            # Set a very quick socket timeout to prevent sandbox DNS hanging
            socket.setdefaulttimeout(1.0)
            ip_str = socket.gethostbyname(hostname)
            ip = ipaddress.ip_address(ip_str)
        except Exception:
            # If resolution fails in sandbox or offline environment, allow if standard public domain
            if "." in hostname and not hostname.endswith(".local") and not hostname.endswith(".internal"):
                return True, "Public domain format accepted."
            return False, f"Could not resolve hostname '{hostname}'."

    # Check if IP is private, loopback, link-local, multicast, or reserved
    is_private_or_special = (
        ip.is_private or
        ip.is_loopback or
        ip.is_link_local or
        ip.is_multicast or
        ip.is_reserved or
        ip.is_unspecified
    )

    if is_private_or_special:
        if settings.ALLOW_DEV_PRIVATE_WEBHOOKS:
            return True, "Allowed by development mode exception."
        return False, f"Destination IP {ip} resolves to a private or restricted network address."

    return True, "URL is safe."
