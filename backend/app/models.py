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
