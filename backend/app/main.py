"""Parcel Rate Advisor (assessment starter) — FastAPI backend.

A cut-down, non-sensitive stand-in app for the assessment's Use Case A. Candidates: this
backend gives you the mocked `determine()` stub and a place to submit already-parsed lines —
parsing the sample export format (see ../FORMAT_SPEC.md), the manual assignment screen, the
response export, and headless-browser automation are your task, not this file's.
"""

from __future__ import annotations

import os
import csv
import io

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from .determine import determine
from .models import Determination, LineInput, ReviewExportLine, ShipmentReview
from .parser import parse_geodata

app = FastAPI(title="Parcel Rate Advisor (assessment starter)")

# Local dev only — candidates should tighten this for their own deployed frontend origin.
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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


@app.post("/api/parse", response_model=dict[str, list[ShipmentReview] | list[str]])
async def parse_export(file: UploadFile = File(...)) -> dict[str, list[ShipmentReview] | list[str]]:
    """Parse an uploaded GEODATA export and run each invoice line through determine()."""
    shipments, warnings = parse_geodata(await file.read())
    return {"shipments": shipments, "warnings": warnings}


@app.post("/api/export")
def export_response(lines: list[ReviewExportLine]) -> StreamingResponse:
    """Return the reviewed lines in the required response CSV shape."""
    output = io.StringIO(newline="")
    fields = [
        "consignment_reference", "line_id", "description", "origin", "commodity_code",
        "category", "duty_rate", "vat_rate", "confidence", "status",
    ]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for line in lines:
        writer.writerow(line.model_dump())
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parcel-advisor-response.csv"},
    )
