"""Parcel Rate Advisor (assessment starter) — mocked rate/category determination.

This intentionally reproduces none of any real production rate-determination logic — it's a
small, illustrative keyword lookup so the rest of the app (parsing the sample export format,
the manual assignment screen, the response export, and headless-browser automation) has a
concrete `determine()` call to wire up against.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MockRate:
    category: str
    duty_rate: float
    vat_rate: float
    confidence: float


#: Keyword -> mocked rate, matched case-insensitively against a line's description.
#: First match wins. Deliberately simplistic — this is a stand-in, not real customs logic.
_MOCK_RATES: tuple[tuple[str, MockRate], ...] = (
    ("frame", MockRate("optical", duty_rate=0.022, vat_rate=0.23, confidence=0.75)),
    ("training top", MockRate("clothing_adult", duty_rate=0.12, vat_rate=0.23, confidence=0.55)),
    ("tank top", MockRate("clothing_adult", duty_rate=0.12, vat_rate=0.23, confidence=0.55)),
    ("jogger", MockRate("clothing_adult", duty_rate=0.12, vat_rate=0.23, confidence=0.55)),
    ("scarf", MockRate("clothing_accessory", duty_rate=0.12, vat_rate=0.23, confidence=0.6)),
    ("mug", MockRate("homeware", duty_rate=0.12, vat_rate=0.23, confidence=0.65)),
    ("book", MockRate("books", duty_rate=0.0, vat_rate=0.0, confidence=0.95)),
)

#: Returned when nothing matches — confidence 0.0 signals "unresolved", not a guess.
_UNRESOLVED = MockRate(category="unknown", duty_rate=0.0, vat_rate=0.0, confidence=0.0)


def determine(
    description: str,
    origin: str | None = None,
    commodity_code: str | None = None,
) -> MockRate:
    """Return a mocked rate/category determination for a single line's description.

    `origin`/`commodity_code` are accepted for a realistic call signature but unused by this
    stub's lookup — real rate logic would weigh them; this one only reads `description`.
    """
    text = description.lower()
    for keyword, rate in _MOCK_RATES:
        if keyword in text:
            return rate
    return _UNRESOLVED
