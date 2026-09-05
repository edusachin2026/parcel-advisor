# Sample Export Format Spec

This is the real flat-file format used by a parcel depot system to send consignment data to
a third-party EDI provider for VAT/duty calculation. It's a good real-world parsing exercise:
self-describing, hierarchical, and with genuine edge cases — but not proprietary or secret in
its structure (this style of self-describing flat file is common across the logistics/EDI
industry).

## Overall shape

- Plain text, `;`-delimited fields, one record per line.
- Every data line ends with a trailing `;;` (an empty terminator field).
- The file has no filename extension in real exports; sniff it by content — the first
  non-blank line always starts with `#FILE;GEODATA`.

## Header lines

Three kinds of header line appear before any data:

```
#FILE;<export id>;
#ENCODING;<encoding name>;
#VERSION;<version>;
```

`#ENCODING` names an encoding you must decode the rest of the file with — every real sample
seen so far declares `ISO-8859-1`, but don't hardcode that; read it from the file. If you
encounter an encoding you don't recognise, `latin-1` is a safe fallback (it's a strict
superset of ASCII and never raises a decode error).

## `#DEF` lines — the schema is in the data, not in your code

```
#DEF;GEODATA:<RECORD_TYPE>;field1;field2;field3;...;;
```

Each `#DEF` line declares the column names for one record type, in order. **Do not hardcode
column positions or names anywhere in your parser.** Read them from these lines. This is the
whole point of the exercise: a future export with reordered, renamed, or additional columns
for a record type you already handle should still parse correctly, as long as the record type
itself is unchanged.

Record types you'll see in the sample files:

| Record type | Meaning |
|---|---|
| `HEADER` | File-level metadata (version, classification) |
| `CONSOLIDATION` | Present only in a multi-shipment ("CONSO") file — describes the whole consignment run (flight/lorry, seal number, etc.) |
| `SHIPMENT` | Starts a new consignment block |
| `SENDER` | The consignment's sender/shipper |
| `RECEIVER` | The consignment's receiver/consignee |
| `PARCEL` | A physical parcel within the consignment (barcode + sequence number) |
| `INTER` | Invoice-level commercial data for the consignment |
| `INTERINVOICELINE` | One line item within the consignment (the interesting bit — description, value, origin, commodity code) |

## Hierarchy — no explicit foreign keys

There is **no reliable cross-record join key**. In particular, `NUMORDER` looks like a
per-record-type sequence number, not a foreign key back to the owning shipment — every detail
record belonging to one single-shipment file tends to share the same `NUMORDER` value. Build
the hierarchy by **encounter order** instead: every `SHIPMENT` record starts a new consignment
block, and every `SENDER`/`RECEIVER`/`PARCEL`/`INTER`/`INTERINVOICELINE` record belongs to the
most-recently-seen `SHIPMENT`.

One file can consolidate **multiple shipments** — see `samples/geodata_multi_shipment_sample`,
which contains two separate `SHIPMENT` blocks. Only single-shipment files are guaranteed
correct against real data; multi-shipment support is still something you should implement and
validate against the sample, but treat it as the harder case.

## Malformed lines — validate field counts

There is no escaping/quoting mechanism for the `;` delimiter — this format assumes `;` never
appears inside a field's own text (e.g. a free-text description). You can't fix that, but you
**can** defend against a line that doesn't match its record type's declared column count:

- A line with **more** fields than its `#DEF` declares is genuinely malformed — skip it and
  record a warning, rather than silently misaligning every field after the overflow onto the
  wrong column name.
- A line with **fewer** trailing fields than declared is normal, not an error — trailing
  optional fields are routinely omitted (e.g. a consignment with no CIF cost has no
  `CIFCOST`/`CIFCOSTCUR` values at all, not empty placeholders).

## Sample files

Three anonymised sample exports are provided in `samples/` (fictional company names,
addresses and reference numbers — no real data):

| File | Scenario |
|---|---|
| `geodata_b2b_sample` | Single shipment, B2B invoice terms, 3 line items (optical frames) |
| `geodata_ioss_sample` | Single shipment, IOSS/consumer terms, 4 line items (clothing) |
| `geodata_multi_shipment_sample` | A `CONSO` file consolidating **two** separate shipments in one file |

Each file has no extension, matching the real format — content-sniff it via the
`#FILE;GEODATA` marker rather than relying on a filename/extension.
