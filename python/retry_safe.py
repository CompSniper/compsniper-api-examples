"""Retry temporary limits and failures without looping on monthly quota exhaustion."""

from __future__ import annotations

import os
import random
import time
from typing import Any

import requests

API_URL = "https://api.compsniper.com/v1/scrape"
MAX_ATTEMPTS = 5


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


def json_body(response: requests.Response) -> dict[str, Any]:
    try:
        body = response.json()
        return body if isinstance(body, dict) else {}
    except requests.exceptions.JSONDecodeError:
        return {}


def delay_seconds(response: requests.Response, body: dict[str, Any], attempt: int) -> float:
    raw = response.headers.get("Retry-After") or body.get("retry_after")
    try:
        return max(0.0, float(raw)) if raw is not None else min(2**attempt, 30)
    except (TypeError, ValueError):
        return min(2**attempt, 30)


def search_sold(keyword: str) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {required_api_key()}"}

    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.get(
                API_URL,
                headers=headers,
                params={"keyword": keyword, "count": 240},
                timeout=75,
            )
        except (requests.Timeout, requests.ConnectionError):
            if attempt == MAX_ATTEMPTS - 1:
                raise
            time.sleep(min(2**attempt, 30) + random.uniform(0, 0.5))
            continue

        body = json_body(response)
        code = body.get("code")

        if response.ok:
            print("Requests remaining:", response.headers.get("X-Usage-Remaining", "unknown"))
            return body

        if response.status_code == 429 and code == "quota_exceeded":
            raise RuntimeError(
                "Monthly quota exhausted. "
                f"Reset: {body.get('reset_at')}. Upgrade: {body.get('upgrade_url')}"
            )

        temporary = (
            response.status_code == 429 and code == "rate_limited"
        ) or response.status_code in {500, 502, 503}
        if temporary and attempt < MAX_ATTEMPTS - 1:
            wait = delay_seconds(response, body, attempt)
            time.sleep(wait + random.uniform(0, 0.5))
            continue

        message = body.get("error") or f"CompSniper returned HTTP {response.status_code}"
        raise RuntimeError(message)

    raise RuntimeError("CompSniper request failed after five bounded attempts.")


result = search_sold(os.environ.get("COMPSNIPER_KEYWORD", "9780399145636"))
print("Listings returned:", result.get("totalItems"))
