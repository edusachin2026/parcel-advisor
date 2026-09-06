"""Request/response models for the Parcel Rate Advisor starter API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LineInput(BaseModel):
    """One consignment line, already parsed from whatever source format you choose."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    item_ref: str
    description: str
    origin: str | None = None
    commodity_code: str | None = None


class Determination(BaseModel):
    """A mocked rate/category determination for one line."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    item_ref: str
    description: str
    origin: str | None
    commodity_code: str | None
    category: str
    duty_rate: float
    vat_rate: float
    confidence: float


class ReviewLine(Determination):
    """A determination with consignment context and review state."""

    consignment_reference: str
    line_id: str
    status: str


class ShipmentReview(BaseModel):
    """One shipment and its parsed, rate-determined lines."""

    consignment_reference: str
    lines: list[ReviewLine]


class ReviewExportLine(BaseModel):
    """A reviewed line submitted for response export."""

    consignment_reference: str
    line_id: str
    description: str
    origin: str | None = None
    commodity_code: str | None = None
    category: str
    duty_rate: float
    vat_rate: float
    confidence: float
    status: str
