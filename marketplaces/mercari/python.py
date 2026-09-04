"""Search one page of public Mercari US sold listings."""

from __future__ import annotations

import os

import requests

API_URL = "https://api.compsniper.com/v1/mercari"


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


response = requests.get(
    API_URL,
    headers={"Authorization": f"Bearer {required_api_key()}"},
    params={
        "keyword": os.environ.get("COMPSNIPER_KEYWORD", "sony wh-1000xm5"),
        "count": 25,
        "sold": "true",
    },
    timeout=45,
)
response.raise_for_status()
data = response.json()

summary = data.get("summary") or {}
print(f"Listings returned: {data['totalItems']} of {data['totalResults']}")
print(f"Median displayed price: {summary.get('median')} {summary.get('currency', 'USD')}")
print(f"Monthly requests remaining: {response.headers.get('X-Usage-Remaining', 'unknown')}")

for item in data.get("items", [])[:5]:
    print(f"- {item.get('title')} | ${item.get('price')} | {item.get('condition') or 'condition unavailable'}")
