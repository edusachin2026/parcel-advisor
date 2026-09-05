# Response Export Format Spec

After determining a rate/category for every line in a consignment, produce a response export
containing the final rate/duty per line, ready to be sent back to the depot system. There's
no single mandated real-world format for this exercise — implement the simple schema below
(as CSV or XLSX, your choice).

## Required columns

One row per line item:

| Column | Type | Description |
|---|---|---|
| `consignment_reference` | string | The owning consignment's reference (e.g. `SHIPMENT`'s `MPSID`) |
| `line_id` | string | 1-based position of the line within its consignment (the format has no per-line identifier of its own) |
| `description` | string | The line's goods description, as parsed |
| `origin` | string | Country of origin code, as parsed (may be blank if not present on the line) |
| `commodity_code` | string | Commodity/tariff code, as parsed (may be blank) |
| `category` | string | The category returned by `determine()` |
| `duty_rate` | number | Duty rate as a decimal fraction (e.g. `0.12` for 12%), from `determine()` |
| `vat_rate` | number | VAT rate as a decimal fraction, from `determine()` |
| `confidence` | number | Confidence score returned by `determine()`, `0.0`–`1.0` |
| `status` | string | `auto_resolved` if confidence is at/above your chosen threshold, otherwise `pending_review` |

## Notes

- Pick and document your own confidence threshold for `auto_resolved` vs `pending_review` —
  there's no fixed value required for this exercise, just be explicit about what you chose and
  why in your PR description.
- A row with `status = pending_review` should still contain whatever `determine()` returned
  (don't blank it out) — the point of the manual assignment screen is a human confirming or
  overriding it, not re-deriving it from scratch.
- If you export XLSX instead of CSV, write numeric columns (`duty_rate`, `vat_rate`,
  `confidence`) as real numeric cells, not text — a spreadsheet tool opening the file should
  be able to sum/filter them directly.
