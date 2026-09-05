"""Parcel Rate Advisor (assessment starter) — FastAPI backend.

A cut-down, non-sensitive stand-in app for the assessment's Use Case A. Candidates: this
backend gives you the mocked `determine()` stub and a place to submit already-parsed lines —
parsing the sample export format (see ../FORMAT_SPEC.md), the manual assignment screen, the
response export, and headless-browser automation are your task, not this file's.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .determine import determine
from .models import Determination, LineInput

app = FastAPI(title="Parcel Rate Advisor (assessment starter)")

# Local dev only — candidates should tighten this for their own deployed frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/determinations", response_model=list[Determination])
def create_determinations(lines: list[LineInput]) -> list[Determination]:
    """Run the mocked `determine()` stub over a batch of already-parsed lines."""
    results: list[Determination] = []
    for line in lines:
        rate = determine(line.description, line.origin, line.commodity_code)
        results.append(
            Determination(
                item_ref=line.item_ref,
                description=line.description,
                origin=line.origin,
                commodity_code=line.commodity_code,
                category=rate.category,
                duty_rate=rate.duty_rate,
                vat_rate=rate.vat_rate,
                confidence=rate.confidence,
            )
        )
    return results
