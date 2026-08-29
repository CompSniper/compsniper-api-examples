"""Submit a card-pricing batch and poll until it reaches a terminal state."""

from __future__ import annotations

import os
import time
import uuid

import requests

API_BASE = "https://api.compsniper.com"
TERMINAL = {"done", "partial", "cancelled", "failed"}


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


headers = {
    "Authorization": f"Bearer {required_api_key()}",
    "Content-Type": "application/json",
    "Idempotency-Key": f"example-{uuid.uuid4()}",
}
payload = {
    "cards": [
        {
            "reference": "inventory-001",
            "year": 2023,
            "set": "Topps Chrome",
            "player": "Victor Wembanyama",
            "cardNumber": "1",
            "parallel": "Refractor",
            "grader": "PSA",
            "grade": 10,
        },
        {
            "reference": "inventory-002",
            "keyword": "1999 pokemon base set charizard 4/102 psa 9",
        },
    ],
    "options": {"count": 60, "outputMode": "summary", "relevance": True},
}

submitted = requests.post(
    f"{API_BASE}/v1/cards/batch",
    headers=headers,
    json=payload,
    timeout=30,
)
submitted.raise_for_status()
job = submitted.json()
job_id = job["jobId"]
print("Submitted job:", job_id)

while True:
    response = requests.get(
        f"{API_BASE}/v1/cards/batch/{job_id}",
        headers={"Authorization": headers["Authorization"]},
        timeout=30,
    )
    response.raise_for_status()
    job = response.json()
    print(f"{job['status']}: {job['processedCards']}/{job['totalCards']} processed")
    if job["status"] in TERMINAL:
        break
    time.sleep(5)

for result in job.get("results", []):
    print(result.get("reference"), result.get("status"), result.get("summary"))
