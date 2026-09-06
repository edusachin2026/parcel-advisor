import fs from "node:fs/promises";
import process from "node:process";
import { chromium } from "playwright";

const [, , url, exportPath, reviewPath] = process.argv;
if (!url || !exportPath || !reviewPath) {
  console.error("Usage: node automation/playwright_adapter.mjs <url> <export-file> <review-json>");
  process.exit(2);
}

const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ acceptDownloads: true });

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(exportPath);
  await page.getByText(/lines loaded/).waitFor();

  for (const shipment of review.shipments) {
    await page.getByRole("button", { name: new RegExp(shipment.consignment_reference) }).click();
    for (const line of shipment.lines) {
      const category = page.getByLabel(`Category for line ${line.line_id}`);
      const duty = page.getByLabel(`Duty rate for line ${line.line_id}`);
      const vat = page.getByLabel(`VAT rate for line ${line.line_id}`);
      await category.fill(line.category);
      await duty.fill(String(line.duty_rate * 100));
      await vat.fill(String(line.vat_rate * 100));
      if (!(await category.inputValue()) || !(await duty.inputValue()) || !(await vat.inputValue())) {
        throw new Error(`Validation failed for ${shipment.consignment_reference} line ${line.line_id}`);
      }
    }
  }

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  await (await download).saveAs("parcel-advisor-response.csv");
} catch (error) {
  console.error(`Playwright adapter failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}