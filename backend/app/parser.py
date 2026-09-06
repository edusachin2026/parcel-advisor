"""Parser for the self-describing GEODATA export format."""

from __future__ import annotations

from dataclasses import dataclass, field

from .determine import determine
from .models import ReviewLine, ShipmentReview

CONFIDENCE_THRESHOLD = 0.70


@dataclass
class _Shipment:
    reference: str
    lines: list[ReviewLine] = field(default_factory=list)


def _decode(raw: bytes) -> list[str]:
    """Read the declared encoding without assuming it for the payload."""
    header = raw.decode("ascii", errors="ignore")
    declared = "latin-1"
    for line in header.splitlines():
        if line.startswith("#ENCODING;"):
            declared = line.split(";", 2)[1].strip() or declared
            break
    try:
        text = raw.decode(declared)
    except (LookupError, UnicodeDecodeError):
        text = raw.decode("latin-1")
    return text.splitlines()


def _fields(line: str) -> list[str]:
    values = line.split(";")
    while values and values[-1] == "":
        values.pop()
    return values


def parse_geodata(raw: bytes) -> tuple[list[ShipmentReview], list[str]]:
    """Parse shipments, skipping overflow records and reporting warnings."""
    definitions: dict[str, list[str]] = {}
    warnings: list[str] = []
    shipments: list[_Shipment] = []
    current: _Shipment | None = None

    for line_number, raw_line in enumerate(_decode(raw), start=1):
        line = raw_line.strip("\ufeff\r\n")
        if not line or line.startswith("#"):
            if line.startswith("#DEF;"):
                parts = _fields(line)
                if len(parts) >= 2 and ":" in parts[1]:
                    record_type = parts[1].split(":", 1)[1]
                    definitions[record_type] = parts[2:]
            continue

        values = _fields(line)
        record_type = values[0] if values else ""
        columns = definitions.get(record_type)
        if columns is None:
            warnings.append(f"Line {line_number}: no #DEF for record type {record_type!r}; skipped")
            continue
        data = values[1:]
        if len(data) > len(columns):
            warnings.append(
                f"Line {line_number}: {record_type} has {len(data)} fields, expected at most {len(columns)}; skipped"
            )
            continue
        record = dict(zip(columns, data))
        if record_type == "SHIPMENT":
            current = _Shipment(reference=record.get("MPSID", "") or f"shipment-{len(shipments) + 1}")
            shipments.append(current)
        elif record_type == "INTERINVOICELINE":
            if current is None:
                warnings.append(f"Line {line_number}: invoice line appeared before SHIPMENT; skipped")
                continue
            description = record.get("CCONTENT", "")
            rate = determine(description, record.get("CORIGIN"), record.get("RCTARIF"))
            line_id = str(len(current.lines) + 1)
            current.lines.append(
                ReviewLine(
                    consignment_reference=current.reference,
                    line_id=line_id,
                    item_ref=line_id,
                    description=description,
                    origin=record.get("CORIGIN") or None,
                    commodity_code=record.get("RCTARIF") or None,
                    category=rate.category,
                    duty_rate=rate.duty_rate,
                    vat_rate=rate.vat_rate,
                    confidence=rate.confidence,
                    status=("auto_resolved" if rate.confidence >= CONFIDENCE_THRESHOLD else "pending_review"),
                )
            )

    return [ShipmentReview(consignment_reference=s.reference, lines=s.lines) for s in shipments], warnings