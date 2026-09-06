# Review automation

Install Playwright once:

```bash
cd automation
npm install
npx playwright install chromium
```

Run the unattended adapter with a running frontend and a review JSON file:

```bash
node playwright_adapter.mjs http://localhost:5173 ../samples/geodata_multi_shipment_sample review.json
```

`review.json` uses the API response shape:

```json
{
  "shipments": [
    {
      "consignment_reference": "90000000000003",
      "lines": [
        {"line_id": "1", "category": "clothing_adult", "duty_rate": 0.12, "vat_rate": 0.23}
      ]
    }
  ]
}
```

The adapter fails the job when a shipment, labelled input, or edited value is missing; it never swallows a validation failure. In production, trigger it per uploaded consignment, persist the review JSON and export as job artifacts, and retry only failed jobs with the same input and idempotency key. A batch mode can process a manifest of files sequentially with one result per consignment.