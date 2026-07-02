"""
Analysis service — URL inspection and parameter discovery.

⚠️  This service is designed for educational use against intentionally
    vulnerable lab environments. All requests are made with clear headers
    identifying the tool as an educational analysis platform.

Security measures:
- URL scheme allowlist (http/https only)
- Private IP range blocking (optional, configurable)
- Request timeout enforcement
- Response size limits
- No credential storage or injection
"""

import re
import time
from typing import Optional
from urllib.parse import parse_qs, urljoin, urlparse

import httpx
import structlog
from bs4 import BeautifulSoup

from app.core.config import settings

log = structlog.get_logger()

# Private IP ranges to block in production
PRIVATE_IP_PATTERNS = [
    re.compile(r"^10\."),
    re.compile(r"^172\.(1[6-9]|2[0-9]|3[0-1])\."),
    re.compile(r"^192\.168\."),
    re.compile(r"^127\."),
    re.compile(r"^localhost$", re.IGNORECASE),
    re.compile(r"^::1$"),
    re.compile(r"^0\.0\.0\.0$"),
]

EDUCATIONAL_HEADERS = {
    "User-Agent": "SQLMentor/1.0 Educational Security Analysis Tool (https://github.com/sqlmentor)",
    "X-Educational-Tool": "SQLMentor",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def validate_target_url(url: str) -> tuple[bool, str]:
    """
    Validate that a target URL is safe for analysis.
    Returns (is_valid, error_message).
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format"

    # Scheme allowlist
    if parsed.scheme not in settings.analysis_allowed_schemes_list:
        return False, f"URL scheme '{parsed.scheme}' is not allowed. Use http or https."

    # Must have a hostname
    if not parsed.hostname:
        return False, "URL must include a valid hostname"

    # Block private IP ranges in production (labs use them on localhost intentionally)
    # In development, we allow localhost for DVWA
    if settings.APP_ENV == "production":
        hostname = parsed.hostname
        for pattern in PRIVATE_IP_PATTERNS:
            if pattern.match(hostname):
                return False, (
                    "Private IP addresses and localhost are not allowed in production. "
                    "Use a publicly accessible lab environment."
                )

    return True, ""


class AnalysisService:
    """Service for analyzing lab application inputs and responses."""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=settings.ANALYSIS_REQUEST_TIMEOUT,
            follow_redirects=True,
            max_redirects=5,
            headers=EDUCATIONAL_HEADERS,
            verify=False,  # Lab environments often use self-signed certs
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.client.aclose()

    async def discover_parameters(self, url: str) -> dict:
        """
        Discover user-controllable input parameters in a lab application.
        Inspects: query strings, forms, visible inputs.
        """
        is_valid, error = validate_target_url(url)
        if not is_valid:
            raise ValueError(error)

        log.info("Discovering parameters", url=url)
        discovered = {
            "query_params": [],
            "form_params": [],
            "hidden_fields": [],
            "all_inputs": [],
        }

        try:
            response = await self.client.get(url)
            body = response.text[:settings.ANALYSIS_MAX_RESPONSE_SIZE]
        except httpx.TimeoutException:
            raise ValueError(f"Request timed out after {settings.ANALYSIS_REQUEST_TIMEOUT}s")
        except httpx.RequestError as exc:
            raise ValueError(f"Could not connect to target: {exc}")

        # Parse query string parameters
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        for name, values in query_params.items():
            discovered["query_params"].append({
                "name": name,
                "sample_value": values[0] if values else "",
                "location": "query",
            })

        # Parse HTML forms
        try:
            soup = BeautifulSoup(body, "html.parser")
            forms = soup.find_all("form")
            for form in forms:
                action = form.get("action", "")
                method = form.get("method", "get").upper()
                inputs = form.find_all(["input", "select", "textarea"])
                for inp in inputs:
                    input_name = inp.get("name")
                    if not input_name:
                        continue
                    input_type = inp.get("type", "text").lower()
                    is_hidden = input_type == "hidden"
                    discovered["form_params" if not is_hidden else "hidden_fields"].append({
                        "name": input_name,
                        "type": input_type,
                        "method": method,
                        "form_action": action,
                        "sample_value": inp.get("value", ""),
                        "location": "form",
                    })
        except Exception as exc:
            log.warning("HTML parsing error", error=str(exc))

        # Combine all discovered parameters
        discovered["all_inputs"] = (
            discovered["query_params"]
            + discovered["form_params"]
            + discovered["hidden_fields"]
        )

        log.info(
            "Parameter discovery complete",
            total=len(discovered["all_inputs"]),
        )
        return discovered

    async def fetch_response(
        self,
        url: str,
        method: str = "GET",
        params: Optional[dict] = None,
        data: Optional[dict] = None,
        label: str = "baseline",
    ) -> dict:
        """
        Fetch an HTTP response from the lab application.
        Returns structured response data (no raw storage of sensitive content).
        """
        is_valid, error = validate_target_url(url)
        if not is_valid:
            raise ValueError(error)

        start_time = time.monotonic()

        try:
            if method.upper() == "POST":
                response = await self.client.post(url, data=data or {})
            else:
                response = await self.client.get(url, params=params or {})

            elapsed_ms = (time.monotonic() - start_time) * 1000

            body = response.text[:settings.ANALYSIS_MAX_RESPONSE_SIZE]
            body_size = len(response.content)

            return {
                "status_code": response.status_code,
                "response_time_ms": round(elapsed_ms, 2),
                "content_length": body_size,
                "headers": dict(response.headers),
                "body_excerpt": body[:10_000],  # First 10KB for comparison
                "final_url": str(response.url),
                "label": label,
            }

        except httpx.TimeoutException:
            raise ValueError("Request timed out")
        except httpx.RequestError as exc:
            raise ValueError(f"Request failed: {exc}")
